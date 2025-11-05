/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { HttpSetup } from '@kbn/core/public';
import { render, screen, within } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WithAppDependencies } from '../helpers';
import { RemoteClusterList } from '../../../public/application/sections/remote_cluster_list';
import { createRemoteClustersStore } from '../../../public/application/store/store';
import { registerRouter } from '../../../public/application/services/routing';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { I18nProvider } from '@kbn/i18n-react';

export interface RemoteClusterListTestBed extends RenderResult {
  actions: {
    selectRemoteClusterAt: (index: number) => Promise<void>;
    clickBulkDeleteButton: () => Promise<void>;
    clickRowActionButtonAt: (index: number, action: 'delete' | 'edit') => Promise<void>;
    clickConfirmModalDeleteRemoteCluster: () => Promise<void>;
    clickRemoteClusterAt: (index: number) => Promise<void>;
    clickPaginationNextButton: () => Promise<void>;
  };
  user: ReturnType<typeof userEvent.setup>;
}

export const setup = async (
  httpSetup: HttpSetup,
  overrides?: Record<string, unknown>
): Promise<RemoteClusterListTestBed> => {
  const store = createRemoteClustersStore();
  const AppComponent = WithAppDependencies(RemoteClusterList, httpSetup, overrides);

  const user = userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  const ComponentWithProviders = () => {
    return (
      <I18nProvider>
        <MemoryRouter
          initialEntries={['/']}
          onNavigate={(router) => registerRouter(router as any)}
        >
          <Provider store={store}>
            <AppComponent />
          </Provider>
        </MemoryRouter>
      </I18nProvider>
    );
  };

  const renderResult = render(<ComponentWithProviders />);

  const EUI_TABLE = 'remoteClusterListTable';

  // User actions
  const selectRemoteClusterAt = async (index: number = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRow = rows[index + 1];
    const checkbox = within(dataRow).getByRole('checkbox');
    await user.click(checkbox);
  };

  const clickBulkDeleteButton = async () => {
    const button = screen.getByTestId('remoteClusterBulkDeleteButton');
    await user.click(button);
  };

  const clickRowActionButtonAt = async (index: number = 0, action: 'delete' | 'edit' = 'delete') => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRow = rows[index + 1];

    const testId =
      action === 'delete'
        ? 'remoteClusterTableRowRemoveButton'
        : 'remoteClusterTableRowEditButton';
    const button = within(dataRow).getByTestId(testId);
    await user.click(button);
  };

  const clickConfirmModalDeleteRemoteCluster = async () => {
    const modal = screen.getByTestId('remoteClustersDeleteConfirmModal');
    const confirmButton = within(modal).getByTestId('confirmModalConfirmButton');
    await user.click(confirmButton);
  };

  const clickRemoteClusterAt = async (index: number = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRow = rows[index + 1];
    const link = within(dataRow).getByTestId('remoteClustersTableListClusterLink');
    await user.click(link);
  };

  const clickPaginationNextButton = async () => {
    const button = screen.getByTestId('remoteClusterListTable.pagination-button-next');
    await user.click(button);
  };

  return {
    ...renderResult,
    actions: {
      selectRemoteClusterAt,
      clickBulkDeleteButton,
      clickRowActionButtonAt,
      clickConfirmModalDeleteRemoteCluster,
      clickRemoteClusterAt,
      clickPaginationNextButton,
    },
    user,
  };
};
