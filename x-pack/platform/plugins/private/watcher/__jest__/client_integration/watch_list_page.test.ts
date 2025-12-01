/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, within, waitFor } from '@testing-library/react';
import * as fixtures from '../../__fixtures__';
import { setupEnvironment, pageHelpers, getRandomString } from './helpers';
import type { WatchListTestBed } from './helpers/watch_list_page.helpers';
import { API_BASE_PATH } from '../../common/constants';

const { setup } = pageHelpers.watchListPage;

describe('<WatchListPage />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();
  let testBed: WatchListTestBed;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('on component mount', () => {
    describe('watches', () => {
      describe('when there are no watches', () => {
        beforeEach(async () => {
          httpRequestsMockHelpers.setLoadWatchesResponse({ watches: [] });
          testBed = await setup(httpSetup);
        });

        test('should display an empty prompt', async () => {
          expect(screen.getByTestId('emptyPrompt')).toBeInTheDocument();
          expect(within(screen.getByTestId('emptyPrompt')).getByTestId('createWatchButton')).toBeInTheDocument();
        });
      });

      // create a threshold and advanced watch type and monitoring
      describe('when there are watches', () => {
        const watch1 = fixtures.getWatch({
          name: `watchA-${getRandomString()}`,
          id: `a-${getRandomString()}`,
          type: 'threshold',
        });
        const watch2 = fixtures.getWatch({
          name: `watchB-${getRandomString()}`,
          id: `b-${getRandomString()}`,
          type: 'json',
        });
        const watch3 = fixtures.getWatch({
          name: `watchC-${getRandomString()}`,
          id: `c-${getRandomString()}`,
          type: 'monitoring',
          isSystemWatch: true,
        });

        const watches = [watch1, watch2, watch3];

        beforeEach(async () => {
          httpRequestsMockHelpers.setLoadWatchesResponse({ watches });
          testBed = await setup(httpSetup);
        });

        test('should show error callout if search is invalid', async () => {
          const { actions } = testBed;

          await actions.searchWatches('or');

          expect(screen.getByTestId('watcherListSearchError')).toBeInTheDocument();
        });

        test('should retain the search query', async () => {
          const { actions } = testBed;

          await actions.searchWatches(watch1.name);

          // Wait for table to update
          await waitFor(() => {
            const table = screen.getByTestId('watchesTable');
            const rows = within(table).queryAllByRole('row');
            // Skip header row
            const dataRows = rows.slice(1);
            expect(dataRows.length).toBe(1);
          });

          // Verify watch1 is visible in the table
          const table = screen.getByTestId('watchesTable');
          expect(within(table).getByText(watch1.id)).toBeInTheDocument();
          expect(within(table).getByText(watch1.name)).toBeInTheDocument();

          await actions.advanceTimeToTableRefresh();

          // Verify watch1 is still the only watch visible after refresh
          await waitFor(() => {
            const updatedTable = screen.getByTestId('watchesTable');
            const rows = within(updatedTable).queryAllByRole('row');
            const dataRows = rows.slice(1);
            expect(dataRows.length).toBe(1);
            expect(within(updatedTable).getByText(watch1.id)).toBeInTheDocument();
          });
        });

        test('should set the correct app title', () => {
          expect(screen.getByTestId('appTitle')).toHaveTextContent('Watcher');
        });

        test('should have a link to the documentation', () => {
          const docLink = screen.getByTestId('documentationLink');
          expect(docLink).toBeInTheDocument();
          expect(docLink).toHaveTextContent('Watcher docs');
        });

        test('should list them in the table', async () => {
          const table = screen.getByTestId('watchesTable');
          const rows = within(table).queryAllByRole('row');
          // Skip header row
          const dataRows = rows.slice(1);

          expect(dataRows.length).toBe(watches.length);

          watches.forEach((watch) => {
            expect(within(table).getByText(watch.id)).toBeInTheDocument();
            if (watch.name) {
              expect(within(table).getByText(watch.name)).toBeInTheDocument();
            }
          });
        });

        test('should have a button to create a watch', () => {
          expect(screen.getByTestId('createWatchButton')).toBeInTheDocument();
        });

        test('should have a link to view watch details', () => {
          const watchLink = screen.getByTestId(`watchIdColumn-${watch1.id}`);
          expect(watchLink).toBeInTheDocument();
          expect(watchLink).toHaveAttribute('href', `/watches/watch/${watch1.id}/status`);
        });

        test('should have action buttons on each row to edit and delete a watch', () => {
          const table = screen.getByTestId('watchesTable');
          const rows = within(table).queryAllByRole('row');
          // Skip header row - get first data row
          const firstDataRow = rows[1];

          expect(within(firstDataRow).getByTestId('editWatchButton')).toBeInTheDocument();
          expect(within(firstDataRow).getByTestId('deleteWatchButton')).toBeInTheDocument();
        });

        describe('system watch', () => {
          test('should disable edit and delete actions', async () => {
            const table = screen.getByTestId('watchesTable');
            const rows = within(table).queryAllByRole('row');
            // System watch is the third item (index 3 including header)
            const systemWatchRow = rows[3];

            const checkbox = within(systemWatchRow).getByTestId(
              `checkboxSelectRow-${watch3.id}`
            );
            expect(checkbox).toBeDisabled();

            const editButton = within(systemWatchRow).getByTestId('editWatchButton');
            expect(editButton).toBeDisabled();

            const deleteButton = within(systemWatchRow).getByTestId('deleteWatchButton');
            expect(deleteButton).toBeDisabled();
          });
        });

        describe('delete watch', () => {
          test('should show a confirmation when clicking the delete watch button', async () => {
            const { actions } = testBed;

            await actions.clickWatchActionAt(0, 'delete');

            // Modal is added to document.body
            await waitFor(() => {
              expect(
                document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]')
              ).toBeInTheDocument();
            });

            const modal = document.body.querySelector(
              '[data-test-subj="deleteWatchesConfirmation"]'
            );
            expect(modal?.textContent).toContain('Delete watch');
          });

          test('should send the correct HTTP request to delete watch', async () => {
            const { actions } = testBed;
            const table = screen.getByTestId('watchesTable');
            const rows = within(table).queryAllByRole('row');
            // Get first data row (skip header)
            const firstDataRow = rows[1];
            const cells = within(firstDataRow).queryAllByRole('cell');
            // Watch name is in the third cell (index 2: checkbox, id, name)
            const watchName = cells[2].textContent;

            await actions.clickWatchActionAt(0, 'delete');

            await waitFor(() => {
              expect(
                document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]')
              ).toBeInTheDocument();
            });

            const modal = document.body.querySelector(
              '[data-test-subj="deleteWatchesConfirmation"]'
            );
            const confirmButton = modal!.querySelector(
              '[data-test-subj="confirmModalConfirmButton"]'
            ) as HTMLButtonElement;

            httpRequestsMockHelpers.setDeleteWatchResponse({
              results: {
                successes: [watchName],
                errors: [],
              },
            });

            confirmButton.click();

            await waitFor(() => {
              expect(httpSetup.post).toHaveBeenLastCalledWith(
                `${API_BASE_PATH}/watches/delete`,
                expect.anything()
              );
            });
          });
        });
      });
    });
  });
});
