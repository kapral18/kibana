/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import type { HttpSetup } from '@kbn/core/public';
import { scopedHistoryMock } from '@kbn/core/public/mocks';

import { EsDeprecations } from '../../../public/application/components';
import { WithAppDependencies } from '../helpers';

export interface ElasticsearchTestBed extends RenderResult {
  user: UserEvent;
  actions: {
    table: {
      clickRefreshButton: () => Promise<void>;
      clickDeprecationRowAt: (config: {
        deprecationType:
          | 'mlSnapshot'
          | 'indexSetting'
          | 'reindex'
          | 'default'
          | 'clusterSetting'
          | 'dataStream'
          | 'unfreeze';
        index: number;
        action?: 'reindex' | 'readonly' | 'unfreeze';
      }) => Promise<void>;
      clickReindexColumnAt: (
        columnType: 'level' | 'message' | 'type' | 'index' | 'correctiveAction',
        index: number
      ) => Promise<void>;
    };
    searchBar: {
      clickTypeFilterDropdown: () => Promise<void>;
      clickStatusFilterDropdown: () => Promise<void>;
      setSearchInputValue: (searchValue: string) => Promise<void>;
      clickFilterByTitle: (title: string) => Promise<void>;
    };
    pagination: {
      clickPaginationAt: (index: number) => Promise<void>;
      clickRowsPerPageDropdown: () => Promise<void>;
    };
    mlDeprecationFlyout: {
      clickUpgradeSnapshot: () => Promise<void>;
      clickDeleteSnapshot: () => Promise<void>;
    };
    reindexDeprecationFlyout: {
      clickReindexButton: () => Promise<void>;
      closeFlyout: () => Promise<void>;
      clickReadOnlyButton: () => Promise<void>;
      clickUnfreezeButton: () => Promise<void>;
      checkMigrationWarningCheckbox: () => Promise<void>;
    };
    indexSettingsDeprecationFlyout: {
      clickDeleteSettingsButton: () => Promise<void>;
    };
    clusterSettingsDeprecationFlyout: {
      clickDeleteSettingsButton: () => Promise<void>;
    };
    dataStreamDeprecationFlyout: {
      clickReindexButton: () => Promise<void>;
      clickReadOnlyButton: () => Promise<void>;
      closeFlyout: () => Promise<void>;
      checkMigrationWarningCheckbox: () => Promise<void>;
      clickStartActionButton: () => Promise<void>;
    };
  };
}

export const setupElasticsearchPage = async (
  httpSetup: HttpSetup,
  overrides?: Record<string, unknown>
): Promise<ElasticsearchTestBed> => {
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
  history.location.pathname = '/es_deprecations';

  const EsDeprecationsWithDependencies = WithAppDependencies(EsDeprecations, httpSetup, overrides);

  const renderResult = render(<EsDeprecationsWithDependencies history={history} />);

  const clickFilterByIndex = async (index: number) => {
    const searchBarContainer = screen.getByTestId('searchBarContainer');
    const filterButtons = within(searchBarContainer).getAllByRole('button', {
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
        async clickDeprecationRowAt(config) {
          const { deprecationType, index, action } = config;
          const testId = `deprecation-${deprecationType}${action ? `-${action}` : ''}`;
          const buttons = screen.getAllByTestId(testId);
          await user.click(buttons[index]);
        },
        async clickReindexColumnAt(columnType, index) {
          const cells = screen.getAllByTestId(`reindexTableCell-${columnType}`);
          await user.click(cells[index]);
        },
      },

      searchBar: {
        async clickTypeFilterDropdown() {
          await clickFilterByIndex(1); // Type filter is the second filter button
        },
        async clickStatusFilterDropdown() {
          await clickFilterByIndex(0); // Status filter is the first filter button
        },
        async setSearchInputValue(searchValue: string) {
          const searchBarContainer = screen.getByTestId('searchBarContainer');
          const input = within(searchBarContainer).getByRole('textbox');
          fireEvent.keyUp(input, { target: { value: searchValue } });
        },
        async clickFilterByTitle(title: string) {
          // We need to read the document "body" as the filter dropdown (an EuiSelectable)
          // is added in a portalled popover and not inside the component DOM tree.
          await waitFor(() => {
            const filterButton: HTMLButtonElement | null = document.body.querySelector(
              `.euiSelectableListItem[title=${title}]`
            );
            expect(filterButton).not.toBeNull();
            filterButton!.click();
          });
        },
      },

      pagination: {
        async clickPaginationAt(index) {
          const button = screen.getByTestId(`pagination-button-${index}`);
          await user.click(button);
        },
        async clickRowsPerPageDropdown() {
          const button = screen.getByTestId('tablePaginationPopoverButton');
          await user.click(button);
        },
      },

      mlDeprecationFlyout: {
        async clickUpgradeSnapshot() {
          const button = screen.getByTestId('mlSnapshotDetails.upgradeSnapshotButton');
          await user.click(button);
        },
        async clickDeleteSnapshot() {
          const button = screen.getByTestId('mlSnapshotDetails.deleteSnapshotButton');
          await user.click(button);
        },
      },

      indexSettingsDeprecationFlyout: {
        async clickDeleteSettingsButton() {
          const button = screen.getByTestId('deleteSettingsButton');
          await user.click(button);
        },
      },

      clusterSettingsDeprecationFlyout: {
        async clickDeleteSettingsButton() {
          const button = screen.getByTestId('deleteClusterSettingsButton');
          await user.click(button);
        },
      },

      reindexDeprecationFlyout: {
        async clickReindexButton() {
          const button = screen.getByTestId('startReindexingButton');
          await user.click(button);
        },
        async closeFlyout() {
          const button = screen.getByTestId('closeReindexButton');
          await user.click(button);
        },
        async clickReadOnlyButton() {
          const button = screen.getByTestId('startIndexReadonlyButton');
          await user.click(button);
        },
        async clickUnfreezeButton() {
          const button = screen.getByTestId('startIndexUnfreezeButton');
          await user.click(button);
        },
        async checkMigrationWarningCheckbox() {
          const checkbox = screen
            .getByTestId('warninStepCheckbox')
            .querySelector('input.euiCheckbox__input') as HTMLInputElement;
          fireEvent.change(checkbox, { target: { checked: true } });
        },
      },

      dataStreamDeprecationFlyout: {
        async clickReindexButton() {
          const button = screen.getByTestId('startDataStreamReindexingButton');
          await user.click(button);
        },
        async clickReadOnlyButton() {
          const button = screen.getByTestId('startDataStreamReadonlyButton');
          await user.click(button);
        },
        async closeFlyout() {
          const button = screen.getByTestId('closeDataStreamConfirmStepButton');
          await user.click(button);
        },
        async checkMigrationWarningCheckbox() {
          const checkbox = screen
            .getByTestId('migrationWarningCheckbox')
            .querySelector('input.euiCheckbox__input') as HTMLInputElement;
          fireEvent.change(checkbox, { target: { checked: true } });
        },
        async clickStartActionButton() {
          const button = screen.getByTestId('startActionButton');
          await user.click(button);
        },
      },
    },
  };
};
