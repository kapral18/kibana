/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render as reactRender } from '@testing-library/react';
import { I18nProvider } from '@kbn/i18n-react';
import userEvent from '@testing-library/user-event';

/**
 * Renders a component wrapped with I18nProvider for internationalization support.
 */
export function renderWithI18n(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  return reactRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Creates a userEvent instance configured for testing with fake timers.
 * Use this when tests need userEvent interactions with fake timers enabled.
 */
export function createUserEvent() {
  return userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });
}
