/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';
import { screen, within, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { WatchListPage } from '../../../public/application/sections/watch_list_page';
import { ROUTES, REFRESH_INTERVALS } from '../../../common/constants';
import { renderWithRouter, type RenderWithRouterResult } from './render';

export interface WatchListTestBed extends RenderWithRouterResult {
  user: UserEvent;
  actions: {
    selectWatchAt: (index: number) => Promise<void>;
    clickWatchActionAt: (index: number, action: 'delete' | 'edit') => Promise<void>;
    searchWatches: (term: string) => Promise<void>;
    advanceTimeToTableRefresh: () => Promise<void>;
  };
}

export const setup = async (httpSetup: HttpSetup): Promise<WatchListTestBed> => {
  const renderResult = renderWithRouter(WatchListPage, {
    httpSetup,
    initialEntries: [`${ROUTES.API_ROOT}/watches`],
    routePath: `${ROUTES.API_ROOT}/watches`,
  });

  const { user } = renderResult;

  // Wait for component to finish initial load
  await waitFor(
    () => {
      // Wait for either the table, empty prompt, or error to appear
      const hasTable = screen.queryByTestId('watchesTable');
      const hasEmptyPrompt = screen.queryByTestId('emptyPrompt');
      const hasError = screen.queryByTestId('watcherListSearchError');
      const isLoading = screen.queryByTestId('sectionLoading');
      
      expect(isLoading).not.toBeInTheDocument();
      expect(hasTable || hasEmptyPrompt || hasError).toBeTruthy();
    },
    { timeout: 3000 }
  );

  /**
   * User Actions
   */

  const selectWatchAt = async (index: number) => {
    const table = screen.getByTestId('watchesTable');
    const rows = within(table).queryAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const checkbox = within(dataRows[index]).getByRole('checkbox');
    await user.click(checkbox);
  };

  const clickWatchActionAt = async (index: number, action: 'delete' | 'edit') => {
    const table = screen.getByTestId('watchesTable');
    const rows = within(table).queryAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const button = within(dataRows[index]).getByTestId(`${action}WatchButton`);
    await user.click(button);
  };

  const searchWatches = async (term: string) => {
    const searchInput = screen.getByRole('searchbox');
    await user.clear(searchInput);
    await user.type(searchInput, term);
    await user.keyboard('{Enter}');
  };

  const advanceTimeToTableRefresh = async () => {
    jest.advanceTimersByTime(REFRESH_INTERVALS.WATCH_LIST);
    await waitFor(
      () => {
        // Wait for loading to complete
        expect(screen.queryByTestId('sectionLoading')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  };

  return {
    ...renderResult,
    user,
    actions: {
      selectWatchAt,
      clickWatchActionAt,
      searchWatches,
      advanceTimeToTableRefresh,
    },
  };
};
