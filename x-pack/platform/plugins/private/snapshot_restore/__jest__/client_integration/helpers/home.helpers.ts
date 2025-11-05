/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, within } from '@testing-library/react';
import type { HttpSetup } from '@kbn/core/public';
import { SnapshotRestoreHome } from '../../../public/application/sections/home/home';
import { BASE_PATH } from '../../../public/application/constants';
import { renderWithRouter } from './setup_environment';
import type { RenderWithProvidersResult } from './setup_environment';

export interface HomeTestBed extends RenderWithProvidersResult {
  actions: {
    clickReloadButton: () => Promise<void>;
    selectRepositoryAt: (index: number) => Promise<void>;
    clickRepositoryAt: (index: number) => Promise<void>;
    clickSnapshotAt: (index: number) => Promise<void>;
    clickRepositoryActionAt: (index: number, action: 'delete' | 'edit') => Promise<void>;
    selectTab: (tab: 'snapshots' | 'repositories') => Promise<void>;
    selectSnapshotDetailTab: (tab: 'summary' | 'failedIndices') => Promise<void>;
  };
}

export const setup = (httpSetup: HttpSetup): HomeTestBed => {
  const renderResult = renderWithRouter(<SnapshotRestoreHome />, {
    initialEntries: [`${BASE_PATH}/repositories`],
    httpSetup,
  });

  const { user, history } = renderResult;
  const REPOSITORY_TABLE = 'repositoryTable';
  const SNAPSHOT_TABLE = 'snapshotTable';

  /**
   * User Actions
   */
  const clickReloadButton = async () => {
    const button = screen.getByTestId('reloadButton');
    await user.click(button);
  };

  const selectRepositoryAt = async (index: number) => {
    const table = screen.getByTestId(REPOSITORY_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const checkbox = within(dataRows[index]).getByRole('checkbox');
    await user.click(checkbox);
  };

  const clickRepositoryAt = async (index: number) => {
    const table = screen.getByTestId(REPOSITORY_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const repositoryLink = within(dataRows[index]).getByTestId('repositoryLink');
    await user.click(repositoryLink);
  };

  const clickRepositoryActionAt = async (index: number, action: 'delete' | 'edit') => {
    const table = screen.getByTestId('repositoryTable');
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const button = within(dataRows[index]).getByTestId(`${action}RepositoryButton`);
    await user.click(button);
  };

  const clickSnapshotAt = async (index: number) => {
    const table = screen.getByTestId(SNAPSHOT_TABLE);
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const snapshotLink = within(dataRows[index]).getByTestId('snapshotLink');
    await user.click(snapshotLink);
  };

  const selectTab = async (tab: 'repositories' | 'snapshots') => {
    const tabButton = screen.getByTestId(`${tab}_tab`);
    await user.click(tabButton);
  };

  const selectSnapshotDetailTab = async (tab: 'summary' | 'failedIndices') => {
    const tabs = screen.getAllByTestId('snapshotDetail.tab');
    const tabIndex = tab === 'summary' ? 0 : 1;
    await user.click(tabs[tabIndex]);
  };

  return {
    ...renderResult,
    actions: {
      clickReloadButton,
      selectRepositoryAt,
      clickRepositoryAt,
      clickSnapshotAt,
      clickRepositoryActionAt,
      selectTab,
      selectSnapshotDetailTab,
    },
  };
};
