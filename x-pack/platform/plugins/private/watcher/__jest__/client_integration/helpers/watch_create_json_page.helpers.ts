/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { WatchEditPage } from '../../../public/application/sections/watch_edit_page';
import { registerRouter } from '../../../public/application/lib/navigation';
import { ROUTES, WATCH_TYPES } from '../../../common/constants';
import { renderWithRouter, type RenderWithRouterResult } from './render';

export interface WatchCreateJsonTestBed extends RenderWithRouterResult {
  user: UserEvent;
  actions: {
    selectTab: (tab: 'edit' | 'simulate') => Promise<void>;
    clickSubmitButton: () => Promise<void>;
    clickSimulateButton: () => Promise<void>;
  };
}

export const setup = async (httpSetup: HttpSetup): Promise<WatchCreateJsonTestBed> => {
  const renderResult = renderWithRouter(WatchEditPage, {
    httpSetup,
    initialEntries: [`${ROUTES.API_ROOT}/watches/new-watch/${WATCH_TYPES.JSON}`],
    routePath: `${ROUTES.API_ROOT}/watches/new-watch/:type`,
    onRouter: (router) => registerRouter(router),
  });

  const { user } = renderResult;

  // Wait for component to finish initial load
  await waitFor(
    () => {
      const isLoading = screen.queryByTestId('sectionLoading');
      const hasForm = screen.queryByTestId('jsonWatchForm') || screen.queryByTestId('sectionError');
      expect(isLoading).not.toBeInTheDocument();
      expect(hasForm).toBeTruthy();
    },
    { timeout: 3000 }
  );

  /**
   * User Actions
   */

  const selectTab = async (tab: 'edit' | 'simulate') => {
    const tabs = ['edit', 'simulate'];
    const tabButtons = screen.getAllByRole('tab');
    await user.click(tabButtons[tabs.indexOf(tab)]);
  };

  const clickSubmitButton = async () => {
    const button = screen.getByTestId('saveWatchButton');
    await user.click(button);
  };

  const clickSimulateButton = async () => {
    const button = screen.getByTestId('simulateWatchButton');
    await user.click(button);
  };

  return {
    ...renderResult,
    user,
    actions: {
      selectTab,
      clickSubmitButton,
      clickSimulateButton,
    },
  };
};
