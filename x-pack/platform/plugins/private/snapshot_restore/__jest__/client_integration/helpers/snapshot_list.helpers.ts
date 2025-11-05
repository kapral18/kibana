/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';

import { BASE_PATH } from '../../../public/application/constants';
import { SnapshotList } from '../../../public/application/sections/home/snapshot_list';
import { renderWithRouter } from './setup_environment';
import type { RenderWithProvidersResult } from './setup_environment';

export interface SnapshotListTestBed extends RenderWithProvidersResult {
  actions: {
    setSearchText: (value: string, advanceTime?: boolean) => Promise<void>;
    searchErrorExists: () => boolean;
    getSearchErrorText: () => string;
  };
}

const searchBarSelector = 'snapshotListSearch';
const searchErrorSelector = 'snapshotListSearchError';

export const setup = (query?: string): SnapshotListTestBed => {
  const renderResult = renderWithRouter(<SnapshotList />, {
    initialEntries: [`${BASE_PATH}/snapshots${query ?? ''}`],
  });

  const { user } = renderResult;

  const setSearchText = async (value: string, advanceTime = true) => {
    const searchInput = screen.getByTestId(searchBarSelector);
    await user.clear(searchInput);
    await user.type(searchInput, value);
    
    if (advanceTime) {
      await jest.advanceTimersByTimeAsync(500);
    }
  };

  const searchErrorExists = (): boolean => {
    return screen.queryByTestId(searchErrorSelector) !== null;
  };

  const getSearchErrorText = (): string => {
    const errorElement = screen.getByTestId(searchErrorSelector);
    return errorElement.textContent || '';
  };

  return {
    ...renderResult,
    actions: {
      setSearchText,
      searchErrorExists,
      getSearchErrorText,
    },
  };
};
