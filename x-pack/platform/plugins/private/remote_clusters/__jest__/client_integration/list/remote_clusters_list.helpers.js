/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable import/no-named-as-default */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { Router, Route } from '@kbn/shared-ux-router';
import { createMemoryHistory } from 'history';
import { I18nProvider } from '@kbn/i18n-react';

import { WithAppDependencies } from '../helpers';
import { RemoteClusterList } from '../../../public/application/sections/remote_cluster_list';
import { createRemoteClustersStore } from '../../../public/application/store';
import { registerRouter } from '../../../public/application/services/routing';

export const setup = async (httpSetup, overrides = {}) => {
  const store = createRemoteClustersStore();
  const history = createMemoryHistory();

  // Register router before rendering - the component expects it to be available
  // Match the structure that WithRoute creates: { route: { match, location }, history }
  const router = {
    history,
    route: {
      location: history.location,
      match: { path: '/', url: '/', isExact: true, params: {} },
    },
  };
  registerRouter(router);

  // Create user event instance
  // eslint-disable-next-line no-undef
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  // eslint-disable-next-line new-cap
  const AppWithDependencies = WithAppDependencies(RemoteClusterList, httpSetup, overrides);

  let renderResult;
  act(() => {
    renderResult = render(
      <I18nProvider>
        <Provider store={store}>
          <Router history={history}>
            <Route path="/" component={AppWithDependencies} />
          </Router>
        </Provider>
      </I18nProvider>
    );
  });

  const EUI_TABLE = 'remoteClusterListTable';

  // Helper to get table rows
  const getTableRows = () => {
    const table = screen.queryByTestId(EUI_TABLE);
    if (!table) return [];
    // EUI tables use tbody > tr structure
    const tbody = table.querySelector('tbody');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr'));
  };

  // Helper to get table cells from a row
  const getTableCells = (row) => {
    // EUI tables use td elements
    return Array.from(row.querySelectorAll('td'));
  };

  // Helper to extract table data
  const getTableMetaData = () => {
    const rows = getTableRows();
    const tableCellsValues = rows.map((row) => {
      const cells = getTableCells(row);
      return cells.map((cell) => cell.textContent || '');
    });

    return {
      rows: rows.map((row) => ({
        element: row, // Store the actual DOM element for querying
        columns: getTableCells(row).map((cell) => ({
          element: cell, // Store the actual DOM element
          value: cell.textContent || '',
        })),
      })),
      tableCellsValues,
    };
  };

  // User actions
  const selectRemoteClusterAt = async (index = 0) => {
    const rows = getTableRows();
    // Find checkbox in the first cell
    const checkbox = rows[index].querySelector('input[type="checkbox"]');

    // userEvent.click already wraps in act internally
    await user.click(checkbox);
  };

  const clickBulkDeleteButton = async () => {
    const button = screen.getByTestId('remoteClusterBulkDeleteButton');
    await act(async () => {
      await user.click(button);
    });
  };

  const clickRowActionButtonAt = async (index = 0, action = 'delete') => {
    const rows = getTableRows();
    const row = rows[index];

    let button;
    if (action === 'delete') {
      button = within(row).getByTestId('remoteClusterTableRowRemoveButton');
    } else if (action === 'edit') {
      button = within(row).getByTestId('remoteClusterTableRowEditButton');
    }

    if (!button) {
      throw new Error(`Button for action "${action}" not found.`);
    }

    await act(async () => {
      await user.click(button);
    });
  };

  const clickConfirmModalDeleteRemoteCluster = async () => {
    const modal = screen.getByTestId('remoteClustersDeleteConfirmModal');
    const confirmButton = within(modal).getByTestId('confirmModalConfirmButton');

    await act(async () => {
      await user.click(confirmButton);
    });
  };

  const clickRemoteClusterAt = async (index = 0) => {
    const rows = getTableRows();
    const link = within(rows[index]).getByTestId('remoteClustersTableListClusterLink');

    await act(async () => {
      await user.click(link);
    });
  };

  const clickPaginationNextButton = async () => {
    // EUI pagination uses aria-label for next button
    const button = screen.getByLabelText('Next page');
    await act(async () => {
      await user.click(button);
    });
  };

  return {
    ...renderResult,
    user,
    // Compatibility helpers
    exists: (testId) => screen.queryByTestId(testId) !== null,
    find: (testId) => screen.getByTestId(testId),
    table: {
      getMetaData: (tableTestId) => getTableMetaData(tableTestId),
    },
    form: {
      setInputValue: (testId, value) => {
        const input = screen.getByTestId(testId);
        return act(async () => {
          await user.clear(input);
          await user.type(input, value);
        });
      },
    },
    actions: {
      selectRemoteClusterAt,
      clickBulkDeleteButton,
      clickRowActionButtonAt,
      clickConfirmModalDeleteRemoteCluster,
      clickRemoteClusterAt,
      clickPaginationNextButton,
    },
  };
};
