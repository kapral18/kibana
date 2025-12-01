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
import { PolicyList } from '../../../public/application/sections/home/policy_list';
import { WithAppDependencies } from './setup_environment';

export interface PoliciesListSetupResult extends RenderResult {
  user: UserEvent;
  actions: {
    clickPolicyAt: (index: number) => Promise<void>;
  };
}

export const setupPoliciesListPage = async (
  httpSetup: HttpSetup
): Promise<PoliciesListSetupResult> => {
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
  history.location.pathname = '/policies';

  const AppWithDependencies = WithAppDependencies(PolicyList, httpSetup);

  const renderResult = render(<AppWithDependencies history={history} />);

  return {
    ...renderResult,
    user,
    actions: {
      async clickPolicyAt(index: number) {
        const table = await screen.findByTestId('policyTable');
        const rows = table.querySelectorAll('tbody tr');
        const link = rows[index].querySelector('[data-test-subj="policyLink"]') as HTMLElement;
        if (link) {
          await user.click(link);
        }
      },
    },
  };
};
