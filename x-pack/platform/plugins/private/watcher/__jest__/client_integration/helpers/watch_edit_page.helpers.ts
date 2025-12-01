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
import { ROUTES } from '../../../common/constants';
import { WATCH_ID } from './jest_constants';
import { renderWithRouter, type RenderWithRouterResult } from './render';

export interface WatchEditTestBed extends RenderWithRouterResult {
  user: UserEvent;
  actions: {
    clickSubmitButton: () => Promise<void>;
  };
}

export const setup = async (httpSetup: HttpSetup): Promise<WatchEditTestBed> => {
  const renderResult = renderWithRouter(WatchEditPage, {
    httpSetup,
    initialEntries: [`${ROUTES.API_ROOT}/watches/watch/${WATCH_ID}/edit`],
    routePath: `${ROUTES.API_ROOT}/watches/watch/:id/edit`,
    onRouter: (router) => registerRouter(router),
  });

  const { user } = renderResult;

  // Wait for component to finish initial load
  await waitFor(
    () => {
      const isLoading = screen.queryByTestId('sectionLoading');
      const hasForm =
        screen.queryByTestId('jsonWatchForm') ||
        screen.queryByTestId('thresholdWatchForm') ||
        screen.queryByTestId('sectionError');
      expect(isLoading).not.toBeInTheDocument();
      expect(hasForm).toBeTruthy();
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

  return {
    ...renderResult,
    user,
    actions: {
      clickSubmitButton,
    },
  };
};
