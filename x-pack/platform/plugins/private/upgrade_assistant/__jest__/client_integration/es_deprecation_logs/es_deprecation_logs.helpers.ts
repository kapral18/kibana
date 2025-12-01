/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import type { HttpSetup } from '@kbn/core/public';
import { scopedHistoryMock } from '@kbn/core/public/mocks';

import { Overview } from '../../../public/application/components';
import { WithAppDependencies } from '../helpers';

export interface EsDeprecationLogsTestBed extends RenderResult {
  user: UserEvent;
  actions: {
    clickOpenFlyoutLoggingEnabled: () => Promise<void>;
    clickOpenFlyoutLoggingDisabled: () => Promise<void>;
    clickDeprecationToggle: () => Promise<void>;
    clickResetButton: () => Promise<void>;
    clickCloseFlyout: () => Promise<void>;
  };
}

export const setupESDeprecationLogsPage = async (
  httpSetup: HttpSetup,
  overrides?: Record<string, unknown>
): Promise<EsDeprecationLogsTestBed> => {
  const user = userEventLib.default.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  // Create a scoped history mock with initial entries
  const history = scopedHistoryMock.create();

  // Store listeners for history changes
  const listeners: Array<(location: any, action: any) => void> = [];

  history.createHref.mockImplementation((location) => {
    if (typeof location === 'string') {
      return location;
    }
    return location.pathname || '/';
  });

  // Mock listen to store listeners
  history.listen.mockImplementation((listener) => {
    listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  // Mock push to actually update the location and notify listeners
  history.push.mockImplementation((path) => {
    const pathname = typeof path === 'string' ? path : path.pathname || '/';
    const search = typeof path === 'string' ? '' : path.search || '';
    history.location = {
      ...history.location,
      pathname,
      search,
    };
    history.action = 'PUSH';
    // Notify all listeners with location and action
    listeners.forEach((listener) => listener(history.location, history.action));
  });

  // Set the initial location
  history.location.pathname = '/overview';

  const OverviewWithDependencies = WithAppDependencies(Overview, httpSetup, overrides);

  const renderResult = render(<OverviewWithDependencies history={history} />);

  return {
    ...renderResult,
    user,
    actions: {
      async clickOpenFlyoutLoggingEnabled() {
        const link = await screen.findByTestId('viewDetailsLink');
        await user.click(link);
      },

      async clickOpenFlyoutLoggingDisabled() {
        const link = await screen.findByTestId('enableLogsLink');
        await user.click(link);
      },

      async clickDeprecationToggle() {
        const toggle = await screen.findByTestId('deprecationLoggingToggle');
        await user.click(toggle);
      },

      async clickResetButton() {
        const button = await screen.findByTestId('resetLastStoredDate');
        await user.click(button);
      },

      async clickCloseFlyout() {
        const button = await screen.findByTestId('closeEsDeprecationLogs');
        await user.click(button);
      },
    },
  };
};
