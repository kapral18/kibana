/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { JsonValue, JsonObject } from '@kbn/utility-types';

// Symbol to store original JSON string on parsed objects
const ORIGINAL_JSON_SYMBOL = Symbol('originalJson');

/**
 * Type for objects that may have the original JSON symbol attached
 */
type JsonWithOriginal = JsonObject & {
  [ORIGINAL_JSON_SYMBOL]?: string;
};

/**
 * State machine for tracking string boundaries during JSON formatting
 */
interface FormattingState {
  inString: boolean;
  escapeNext: boolean;
  indent: number;
}

/**
 * Checks if a character is whitespace
 */
const isWhitespace = (char: string): boolean => {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t';
};

/**
 * Generates indentation string for the current indent level
 */
const getIndentation = (level: number): string => {
  return '  '.repeat(level);
};

/**
 * Processes a character that's inside a JSON string
 */
const processStringCharacter = (
  char: string,
  state: FormattingState
): { output: string; state: FormattingState } => {
  const newState = { ...state };

  if (char === '"' && !state.escapeNext) {
    newState.inString = false;
    return { output: char, state: newState };
  }

  newState.escapeNext = char === '\\' && !state.escapeNext;
  return { output: char, state: newState };
};

/**
 * Processes a structural character (brackets, braces, colons, commas)
 */
const processStructuralCharacter = (
  char: string,
  state: FormattingState
): { output: string; state: FormattingState } => {
  const newState = { ...state, escapeNext: false };

  if (char === '{' || char === '[') {
    newState.indent++;
    return { output: char + '\n' + getIndentation(newState.indent), state: newState };
  }

  if (char === '}' || char === ']') {
    newState.indent--;
    return { output: '\n' + getIndentation(newState.indent) + char, state: newState };
  }

  if (char === ',') {
    return { output: char + '\n' + getIndentation(state.indent), state: newState };
  }

  if (char === ':') {
    return { output: ': ', state: newState };
  }

  if (isWhitespace(char)) {
    return { output: '', state: newState };
  }

  return { output: char, state: newState };
};

/**
 * Pretty prints a JSON string while preserving the original number formats
 * including trailing zeros. Uses character-by-character formatting instead of parse/stringify.
 */
const prettyPrintJsonPreservingNumbers = (jsonString: string): string => {
  try {
    // Validate it's valid JSON first
    JSON.parse(jsonString);

    let result = '';
    let state: FormattingState = {
      inString: false,
      escapeNext: false,
      indent: 0,
    };

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      // Handle opening quote
      if (char === '"' && !state.escapeNext) {
        state.inString = !state.inString;
        result += char;
        continue;
      }

      // Process character based on context
      if (state.inString) {
        const processed = processStringCharacter(char, state);
        result += processed.output;
        state = processed.state;
      } else {
        const processed = processStructuralCharacter(char, state);
        result += processed.output;
        state = processed.state;
      }
    }

    return result;
  } catch {
    // If formatting fails, return as-is
    return jsonString;
  }
};

/**
 * Validates if the input should be stringified as an array or object
 */
const isValidJsonInput = (json: unknown, renderAsArray: boolean): boolean => {
  if (renderAsArray) {
    return Array.isArray(json);
  }
  return json !== null && typeof json === 'object' && !Array.isArray(json);
};

/**
 * Checks if the parsed object has been modified since original parsing
 */
const hasObjectBeenModified = (current: JsonValue, originalJsonString: string): boolean => {
  try {
    const reparsed = JSON.parse(originalJsonString);
    const currentStringified = JSON.stringify(current);
    const originalStringified = JSON.stringify(reparsed);
    return currentStringified !== originalStringified;
  } catch {
    return true; // Assume modified if we can't compare
  }
};

/**
 * Attempts to retrieve and use the original JSON string for formatting
 */
const tryUseOriginalFormat = (json: JsonValue): string | null => {
  if (typeof json !== 'object' || json === null) {
    return null;
  }

  const originalJson = (json as JsonWithOriginal)[ORIGINAL_JSON_SYMBOL];

  if (!originalJson || typeof originalJson !== 'string') {
    return null;
  }

  if (hasObjectBeenModified(json, originalJson)) {
    return null;
  }

  return prettyPrintJsonPreservingNumbers(originalJson);
};

/**
 * Stringifies JSON, preserving number format from original string when available.
 * Falls back to standard JSON.stringify for new or modified objects.
 */
export const stringifyJson = (json: unknown, renderAsArray: boolean = true): string => {
  // Return empty structure if input is invalid
  if (!isValidJsonInput(json, renderAsArray)) {
    return renderAsArray ? '[\n\n]' : '{\n\n}';
  }

  // Try to use original formatting if available and unmodified
  const originalFormat = tryUseOriginalFormat(json as JsonValue);
  if (originalFormat) {
    return originalFormat;
  }

  // Fall back to standard stringify for new or modified objects
  return JSON.stringify(json, null, 2);
};

/**
 * Attaches the original JSON string to a parsed object as a non-enumerable property
 */
const attachOriginalJson = (obj: JsonValue, jsonString: string): void => {
  if (obj !== null && typeof obj === 'object') {
    Object.defineProperty(obj, ORIGINAL_JSON_SYMBOL, {
      value: jsonString,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
};

/**
 * Converts a parsed object to an array if needed and attaches original JSON string
 */
const ensureArrayFormat = (parsed: JsonValue, jsonString: string): JsonObject[] => {
  if (Array.isArray(parsed)) {
    // Filter to ensure we only return objects (not primitives)
    const objectArray = parsed.filter(
      (item): item is JsonObject =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );
    return objectArray;
  }

  if (parsed !== null && typeof parsed === 'object') {
    const arrayResult = [parsed];
    attachOriginalJson(arrayResult, jsonString);
    return arrayResult;
  }

  // If parsed is a primitive, return empty array
  return [];
};

/**
 * Parses JSON string and stores the original string for format preservation.
 * This allows stringifyJson to maintain trailing zeros in numeric values.
 */
export function parseJson(jsonString: string, renderAsArray?: true): JsonObject[];
export function parseJson(jsonString: string, renderAsArray: false): JsonObject;
export function parseJson(
  jsonString: string,
  renderAsArray: boolean = true
): JsonObject[] | JsonObject {
  try {
    const parsed = JSON.parse(jsonString);

    // Attach original string for format preservation
    attachOriginalJson(parsed, jsonString);

    // Convert to array if needed
    if (renderAsArray && !Array.isArray(parsed)) {
      return ensureArrayFormat(parsed, jsonString);
    }

    return parsed;
  } catch {
    return renderAsArray ? [] : {};
  }
}
