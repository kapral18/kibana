/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

const CHARS_POOL = 'abcdefghijklmnopqrstuvwxyz';

const generateRandomString = (length: number = 10): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS_POOL.charAt(Math.floor(Math.random() * CHARS_POOL.length));
  }
  return result;
};

export const getRandomString = (): string => `${generateRandomString()}-${Date.now()}`;
