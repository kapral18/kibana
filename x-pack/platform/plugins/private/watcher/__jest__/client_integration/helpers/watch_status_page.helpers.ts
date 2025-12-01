/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';
import { screen, within, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { registerRouter } from '../../../public/application/lib/navigation';
import { WatchStatusPage } from '../../../public/application/sections/watch_status_page';
import { ROUTES } from '../../../common/constants';
import { WATCH_ID } from './jest_constants';
import { renderWithRouter, type RenderWithRouterResult } from './render';

export interface WatchStatusTestBed extends RenderWithRouterResult {
  user: UserEvent;
  actions: {
    selectTab: (tab: 'execution history' | 'action statuses') => Promise<void>;
    clickToggleActivationButton: () => Promise<void>;
    clickAcknowledgeButton: (index: number) => Promise<void>;
    clickDeleteWatchButton: () => Promise<void>;
    clickWatchExecutionAt: (index: number, tableCellText: string) => Promise<void>;
  };
}

export const setup = async (httpSetup: HttpSetup): Promise<WatchStatusTestBed> => {
  const renderResult = renderWithRouter(WatchStatusPage, {
    httpSetup,
    initialEntries: [`${ROUTES.API_ROOT}/watches/watch/${WATCH_ID}/status`],
    routePath: `${ROUTES.API_ROOT}/watches/watch/:id/status`,
    onRouter: (router) => registerRouter(router),
  });

  const { user } = renderResult;

  // Wait for component to finish initial load
  await waitFor(
    () => {
      const isLoading = screen.queryByTestId('sectionLoading');
      const hasContent = 
        screen.queryByTestId('watchDetailSection') || 
        screen.queryByTestId('watchHistorySection') ||
        screen.queryByTestId('sectionError');
      expect(isLoading).not.toBeInTheDocument();
      expect(hasContent).toBeTruthy();
    },
    { timeout: 3000 }
  );

  /**
   * User Actions
   */

  const selectTab = async (tab: 'execution history' | 'action statuses') => {
    const tabs = ['execution history', 'action statuses'];
    const tabButtons = screen.getAllByRole('tab');
    await user.click(tabButtons[tabs.indexOf(tab)]);
  };

  const clickToggleActivationButton = async () => {
    const button = screen.getByTestId('toggleWatchActivationButton');
    await user.click(button);
  };

  const clickAcknowledgeButton = async (index: number) => {
    const table = screen.getByTestId('watchActionStatusTable');
    const rows = within(table).queryAllByRole('row');
    const dataRows = rows.slice(1);
    const button = within(dataRows[index]).getByTestId('acknowledgeWatchButton');
    await user.click(button);
  };

  const clickDeleteWatchButton = async () => {
    const button = screen.getByTestId('deleteWatchButton');
    await user.click(button);
  };

  const clickWatchExecutionAt = async (index: number, tableCellText: string) => {
    const table = screen.getByTestId('watchHistoryTable');
    const button = within(table).getByTestId(`watchStartTimeColumn-${tableCellText}`);
    await user.click(button);
  };

  return {
    ...renderResult,
    user,
    actions: {
      selectTab,
      clickToggleActivationButton,
      clickAcknowledgeButton,
      clickDeleteWatchButton,
      clickWatchExecutionAt,
    },
  };
};
