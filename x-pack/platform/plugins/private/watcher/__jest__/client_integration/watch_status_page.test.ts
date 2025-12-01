/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, within, waitFor } from '@testing-library/react';
import moment from 'moment';
import { getWatchHistory } from '../../__fixtures__';
import { WATCH_STATES, ACTION_STATES } from '../../common/constants';
import { setupEnvironment, pageHelpers } from './helpers';
import type { WatchStatusTestBed } from './helpers/watch_status_page.helpers';
import { WATCH, WATCH_ID } from './helpers/jest_constants';
import { API_BASE_PATH } from '../../common/constants';

const { setup } = pageHelpers.watchStatusPage;

const watchHistory1 = getWatchHistory({ id: 'a', startTime: '2019-06-04T01:11:11.294' });
const watchHistory2 = getWatchHistory({ id: 'b', startTime: '2019-06-04T01:10:10.987Z' });

const watchHistoryItems = { watchHistoryItems: [watchHistory1, watchHistory2] };

const ACTION_ID = 'my_logging_action_1';

const watch = {
  ...WATCH.watch,
  watchStatus: {
    state: WATCH_STATES.ACTIVE,
    isActive: true,
    lastExecution: moment('2019-06-03T19:44:11.088Z'),
    actionStatuses: [
      {
        id: ACTION_ID,
        state: ACTION_STATES.OK,
        isAckable: true,
        lastExecution: moment('2019-06-03T19:44:11.088Z'),
      },
    ],
  },
};

describe('<WatchStatusPage />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();
  let testBed: WatchStatusTestBed;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('on component mount', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadWatchResponse(WATCH_ID, { watch });
      httpRequestsMockHelpers.setLoadWatchHistoryResponse(WATCH_ID, watchHistoryItems);
      testBed = await setup(httpSetup);
    });

    test('should set the correct page title', () => {
      expect(screen.getByTestId('pageTitle')).toHaveTextContent(
        `Current status for '${watch.name}'`
      );
    });

    describe('tabs', () => {
      test('should have 2 tabs', () => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBe(2);
        expect(tabs[0]).toHaveTextContent('Execution history');
        expect(tabs[1]).toHaveTextContent('Action statuses');
      });

      test('should navigate to the "Action statuses" tab', async () => {
        const { actions } = testBed;

        expect(screen.getByTestId('watchHistorySection')).toBeInTheDocument();
        expect(screen.queryByTestId('watchDetailSection')).not.toBeInTheDocument();

        await actions.selectTab('action statuses');

        await waitFor(() => {
          expect(screen.queryByTestId('watchHistorySection')).not.toBeInTheDocument();
          expect(screen.getByTestId('watchDetailSection')).toBeInTheDocument();
        });
      });
    });

    describe('execution history', () => {
      test('should list history items in the table', () => {
        const table = screen.getByTestId('watchHistoryTable');
        const rows = within(table).queryAllByRole('row');
        // Skip header row
        const dataRows = rows.slice(1);

        expect(dataRows.length).toBe(watchHistoryItems.watchHistoryItems.length);

        watchHistoryItems.watchHistoryItems.forEach((historyItem, i) => {
          const row = dataRows[i];
          const formattedTime = moment(historyItem.startTime).format();
          expect(within(row).getByText(formattedTime)).toBeInTheDocument();
        });
      });

      test('should show execution history details on click', async () => {
        const { actions } = testBed;

        const watchHistoryItem = {
          ...watchHistory1,
          watchId: watch.id,
          watchStatus: {
            state: WATCH_STATES.ACTIVE,
            actionStatuses: [
              {
                id: 'my_logging_action_1',
                state: ACTION_STATES.OK,
                isAckable: true,
              },
            ],
          },
        };

        const formattedStartTime = moment(watchHistoryItem.startTime).format();

        httpRequestsMockHelpers.setLoadWatchHistoryItemResponse(WATCH_ID, { watchHistoryItem });

        await actions.clickWatchExecutionAt(0, formattedStartTime);

        await waitFor(() => {
          expect(httpSetup.get).toHaveBeenLastCalledWith(
            `${API_BASE_PATH}/history/${watchHistoryItem.id}`,
            expect.anything()
          );
        });

        expect(screen.getByTestId('watchHistoryDetailFlyout')).toBeInTheDocument();
      });
    });

    describe('delete watch', () => {
      test('should show a confirmation when clicking the delete button', async () => {
        const { actions } = testBed;

        await actions.clickDeleteWatchButton();

        await waitFor(() => {
          expect(
            document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]')
          ).not.toBe(null);
        });

        const modal = document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]');
        expect(modal?.textContent).toContain('Delete watch');
      });

      test('should send the correct HTTP request to delete watch', async () => {
        const { actions } = testBed;

        await actions.clickDeleteWatchButton();

        await waitFor(() => {
          expect(
            document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]')
          ).not.toBe(null);
        });

        const modal = document.body.querySelector('[data-test-subj="deleteWatchesConfirmation"]');
        const confirmButton = modal!.querySelector(
          '[data-test-subj="confirmModalConfirmButton"]'
        ) as HTMLButtonElement;

        httpRequestsMockHelpers.setDeleteWatchResponse({
          results: {
            successes: [watch.id],
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

    describe('activate & deactive watch', () => {
      test('should send the correct HTTP request to deactivate and activate a watch', async () => {
        const { actions } = testBed;

        httpRequestsMockHelpers.setDeactivateWatchResponse(WATCH_ID, {
          watchStatus: {
            state: WATCH_STATES.DISABLED,
            isActive: false,
          },
        });

        await actions.clickToggleActivationButton();

        await waitFor(() => {
          expect(httpSetup.put).toHaveBeenLastCalledWith(
            `${API_BASE_PATH}/watch/${watch.id}/deactivate`,
            expect.anything()
          );
        });

        httpRequestsMockHelpers.setActivateWatchResponse(WATCH_ID, {
          watchStatus: {
            state: WATCH_STATES.ACTIVE,
            isActive: true,
          },
        });

        await actions.clickToggleActivationButton();

        await waitFor(() => {
          expect(httpSetup.put).toHaveBeenLastCalledWith(
            `${API_BASE_PATH}/watch/${watch.id}/activate`,
            expect.anything()
          );
        });
      });
    });

    describe('action statuses', () => {
      beforeEach(async () => {
        const { actions } = testBed;
        await actions.selectTab('action statuses');
      });

      test('should list the watch actions in a table', () => {
        const table = screen.getByTestId('watchActionStatusTable');
        const rows = within(table).queryAllByRole('row');
        // Skip header row
        const dataRows = rows.slice(1);

        expect(dataRows.length).toBe(watch.watchStatus.actionStatuses.length);

        watch.watchStatus.actionStatuses.forEach((action, i) => {
          const row = dataRows[i];
          const { id, state, lastExecution } = action;

          expect(within(row).getByText(id)).toBeInTheDocument();
          expect(within(row).getByText(state)).toBeInTheDocument();
          expect(within(row).getByText(lastExecution.format())).toBeInTheDocument();
        });
      });

      test('should allow an action to be acknowledged', async () => {
        const { actions } = testBed;
        const watchHistoryItem = {
          watchStatus: {
            state: WATCH_STATES.ACTIVE,
            isActive: true,
            comment: 'Acked',
            actionStatuses: [
              {
                id: ACTION_ID,
                state: ACTION_STATES.ACKNOWLEDGED,
                isAckable: false,
                lastExecution: moment('2019-06-03T19:44:11.088Z'),
              },
            ],
          },
        };

        httpRequestsMockHelpers.setAcknowledgeWatchResponse(WATCH_ID, ACTION_ID, watchHistoryItem);

        await actions.clickAcknowledgeButton(0);

        // In previous tests we make calls to activate and deactivate using the put method,
        // so we need to expect that the acknowledge api call will be the third.
        const indexOfAcknowledgeApiCall = 3;
        await waitFor(() => {
          expect(httpSetup.put).toHaveBeenNthCalledWith(
            indexOfAcknowledgeApiCall,
            `${API_BASE_PATH}/watch/${watch.id}/action/${ACTION_ID}/acknowledge`
          );
        });

        const table = screen.getByTestId('watchActionStatusTable');
        const rows = within(table).queryAllByRole('row');
        const dataRows = rows.slice(1);

        dataRows.forEach((row) => {
          expect(within(row).getByText(ACTION_ID)).toBeInTheDocument();
          expect(within(row).getByText(ACTION_STATES.ACKNOWLEDGED)).toBeInTheDocument();
          expect(
            within(row).getByText(
              watchHistoryItem.watchStatus.actionStatuses[0].lastExecution.format()
            )
          ).toBeInTheDocument();
        });
      });
    });
  });
});
