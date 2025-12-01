/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Generates a random string for testing purposes.
 * Replacement for @kbn/test-jest-helpers getRandomString.
 */
export const getRandomString = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Generates a random number for testing purposes.
 * Replacement for @kbn/test-jest-helpers getRandomNumber.
 */
export const getRandomNumber = (options: { min?: number; max?: number } = {}): number => {
  const min = options.min ?? 1;
  const max = options.max ?? 10000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
