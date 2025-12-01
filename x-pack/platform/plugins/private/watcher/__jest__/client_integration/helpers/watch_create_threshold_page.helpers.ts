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

export interface WatchCreateThresholdTestBed extends RenderWithRouterResult {
  user: UserEvent;
  actions: {
    clickSubmitButton: () => Promise<void>;
    clickAddActionButton: () => Promise<void>;
    clickActionLink: (
      actionType: 'logging' | 'email' | 'webhook' | 'index' | 'slack' | 'jira' | 'pagerduty'
    ) => Promise<void>;
    clickSimulateButton: () => Promise<void>;
  };
}

export const setup = async (httpSetup: HttpSetup): Promise<WatchCreateThresholdTestBed> => {
  const renderResult = renderWithRouter(WatchEditPage, {
    httpSetup,
    initialEntries: [`${ROUTES.API_ROOT}/watches/new-watch/${WATCH_TYPES.THRESHOLD}`],
    routePath: `${ROUTES.API_ROOT}/watches/new-watch/:type`,
    onRouter: (router) => registerRouter(router),
  });

  const { user } = renderResult;

  // Wait for component to finish initial load
  await waitFor(
    () => {
      const isLoading = screen.queryByTestId('sectionLoading');
      const hasContent = screen.queryByTestId('pageTitle') || screen.queryByTestId('sectionError');
      expect(isLoading).not.toBeInTheDocument();
      expect(hasContent).toBeTruthy();
    },
    { timeout: 3000 }
  );

  /**
   * User Actions
   */

  const clickSubmitButton = async () => {
    const button = screen.getByTestId('saveWatchButton');
    await user.click(button);
  };

  const clickAddActionButton = async () => {
    const button = screen.getByTestId('addWatchActionButton');
    await user.click(button);
  };

  const clickSimulateButton = async () => {
    const button = screen.getByTestId('simulateActionButton');
    await user.click(button);
  };

  const clickActionLink = async (
    actionType: 'logging' | 'email' | 'webhook' | 'index' | 'slack' | 'jira' | 'pagerduty'
  ) => {
    const button = screen.getByTestId(`${actionType}ActionButton`);
    await user.click(button);
  };

  return {
    ...renderResult,
    user,
    actions: {
      clickSubmitButton,
      clickAddActionButton,
      clickActionLink,
      clickSimulateButton,
    },
  };
};
