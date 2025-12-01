/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import type { HttpSetup } from '@kbn/core/public';
import { scopedHistoryMock } from '@kbn/core/public/mocks';

import { KibanaDeprecations } from '../../../public/application/components';
import { WithAppDependencies } from '../helpers';

export interface KibanaTestBed extends RenderResult {
  user: UserEvent;
  actions: {
    table: {
      clickRefreshButton: () => Promise<void>;
      clickDeprecationAt: (index: number) => Promise<void>;
    };
    flyout: {
      clickResolveButton: () => Promise<void>;
    };
    searchBar: {
      openTypeFilterDropdown: () => Promise<void>;
      openStatusFilterDropdown: () => Promise<void>;
      filterByTitle: (title: string) => Promise<void>;
    };
  };
}

export const setupKibanaPage = async (
  httpSetup: HttpSetup,
  overrides?: Record<string, unknown>
): Promise<KibanaTestBed> => {
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
  history.location.pathname = '/kibana_deprecations';

  const KibanaDeprecationsWithDependencies = WithAppDependencies(
    KibanaDeprecations,
    httpSetup,
    overrides
  );

  const renderResult = render(<KibanaDeprecationsWithDependencies history={history} />);

  const openFilterByIndex = async (index: number) => {
    const kibanaDeprecationsContainer = screen.getByTestId('kibanaDeprecations');
    const filterButtons = within(kibanaDeprecationsContainer).getAllByRole('button', {
      name: /filter/i,
    });
    await user.click(filterButtons[index]);
    // Wait for the filter dropdown to be displayed
    await new Promise(requestAnimationFrame);
  };

  return {
    ...renderResult,
    user,
    actions: {
      table: {
        async clickRefreshButton() {
          const button = await screen.findByTestId('refreshButton');
          await user.click(button);
        },

        async clickDeprecationAt(index: number) {
          const table = screen.getByTestId('kibanaDeprecationsTable');
          const rows = within(table).getAllByRole('row');
          // Skip header row
          const dataRows = rows.slice(1);
          const deprecationLink = within(dataRows[index]).getByTestId('deprecationDetailsLink');
          await user.click(deprecationLink);
        },
      },

      flyout: {
        async clickResolveButton() {
          const button = screen.getByTestId('resolveButton');
          await user.click(button);
        },
      },

      searchBar: {
        async openTypeFilterDropdown() {
          await openFilterByIndex(1);
        },

        async openStatusFilterDropdown() {
          await openFilterByIndex(0);
        },

        async filterByTitle(title: string) {
          // We need to read the document "body" as the filter dropdown (an EuiSelectable)
          // is added in a portalled popover and not inside the component DOM tree.
          const filterButton: HTMLButtonElement | null = document.body.querySelector(
            `.euiSelectableListItem[title=${title}]`
          );

          expect(filterButton).not.toBeNull();
          filterButton!.click();
        },
      },
    },
  };
};
