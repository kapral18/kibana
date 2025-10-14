/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { screen, act } from '@testing-library/react';

import { API_BASE_PATH } from '../../../common/constants';
import './mocks';
import { FOLLOWER_INDEX_EDIT, FOLLOWER_INDEX_EDIT_NAME } from './helpers/constants';
import { setupEnvironment, pageHelpers } from './helpers';

const { setup } = pageHelpers.followerIndexEdit;
const { setup: setupFollowerIndexAdd } = pageHelpers.followerIndexAdd;

describe('Edit follower index', () => {
  let httpSetup;
  let httpRequestsMockHelpers;

  beforeAll(() => {
    jest.useFakeTimers();
    const mockEnvironment = setupEnvironment();
    httpRequestsMockHelpers = mockEnvironment.httpRequestsMockHelpers;
    httpSetup = mockEnvironment.httpSetup;
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on component mount', () => {
    const remoteClusters = [{ name: 'new-york', seeds: ['localhost:123'], isConnected: true }];

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);
      httpRequestsMockHelpers.setGetFollowerIndexResponse(
        FOLLOWER_INDEX_EDIT_NAME,
        FOLLOWER_INDEX_EDIT
      );
      setup();

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    /**
     * As the "edit" follower index component uses the same form underneath that
     * the "create" follower index, we won't test it again but simply make sure that
     * the form component is indeed shared between the 2 app sections.
     */
    test('should use the same Form component as the "<FollowerIndexAdd />" component', async () => {
      setupFollowerIndexAdd();

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      // Both components should render the follower index form
      const forms = screen.getAllByTestId('followerIndexForm');
      expect(forms.length).toBeGreaterThanOrEqual(2);
    });

    test('should populate the form fields with the values from the follower index loaded', () => {
      const inputToPropMap = {
        remoteClusterInput: 'remoteCluster',
        leaderIndexInput: 'leaderIndex',
        followerIndexInput: 'name',
        maxReadRequestOperationCountInput: 'maxReadRequestOperationCount',
        maxOutstandingReadRequestsInput: 'maxOutstandingReadRequests',
        maxReadRequestSizeInput: 'maxReadRequestSize',
        maxWriteRequestOperationCountInput: 'maxWriteRequestOperationCount',
        maxWriteRequestSizeInput: 'maxWriteRequestSize',
        maxOutstandingWriteRequestsInput: 'maxOutstandingWriteRequests',
        maxWriteBufferCountInput: 'maxWriteBufferCount',
        maxWriteBufferSizeInput: 'maxWriteBufferSize',
        maxRetryDelayInput: 'maxRetryDelay',
        readPollTimeoutInput: 'readPollTimeout',
      };

      Object.entries(inputToPropMap).forEach(([input, prop]) => {
        const expected = FOLLOWER_INDEX_EDIT[prop];
        const element = screen.getByTestId(input);
        const value = element.value;
        try {
          expect(value).toBe(expected.toString());
        } catch {
          throw new Error(
            `Input "${input}" does not equal "${expected}". (Value received: "${value}")`
          );
        }
      });
    });
  });

  describe('API', () => {
    const remoteClusters = [{ name: 'new-york', seeds: ['localhost:123'], isConnected: true }];
    let testBed;

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);
      httpRequestsMockHelpers.setGetFollowerIndexResponse(
        FOLLOWER_INDEX_EDIT_NAME,
        FOLLOWER_INDEX_EDIT
      );

      await act(async () => {
        testBed = setup();
        await jest.runAllTimersAsync();
      });
    });

    test('is consumed correctly', async () => {
      const { actions, form } = testBed;

      form.setInputValue('maxRetryDelayInput', '10s');

      actions.clickSaveForm();
      
      // The modal to confirm the update opens
      const confirmButton = screen.getByTestId('confirmModalConfirmButton');
      confirmButton.click();

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(httpSetup.put).toHaveBeenLastCalledWith(
        `${API_BASE_PATH}/follower_indices/${FOLLOWER_INDEX_EDIT_NAME}`,
        expect.objectContaining({
          body: JSON.stringify({
            maxReadRequestOperationCount: 7845,
            maxOutstandingReadRequests: 16,
            maxReadRequestSize: '64mb',
            maxWriteRequestOperationCount: 2456,
            maxWriteRequestSize: '1048b',
            maxOutstandingWriteRequests: 69,
            maxWriteBufferCount: 123456,
            maxWriteBufferSize: '256mb',
            maxRetryDelay: '10s',
            readPollTimeout: '2m',
          }),
        })
      );
    });
  });

  describe('when the remote cluster is disconnected', () => {
    let actions;
    let form;

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse([
        { name: 'new-york', seeds: ['localhost:123'], isConnected: false },
      ]);
      httpRequestsMockHelpers.setGetFollowerIndexResponse(
        FOLLOWER_INDEX_EDIT_NAME,
        FOLLOWER_INDEX_EDIT
      );
      ({ actions, form } = setup());

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    test('should display an error and have a button to edit the remote cluster', () => {
      const error = screen.getByTestId('remoteClusterFormField.notConnectedError');

      expect(error).toBeInTheDocument();
      const title = error.querySelector('.euiCallOutHeader__title');
      expect(title).toHaveTextContent(
        `Can't edit follower index because remote cluster '${FOLLOWER_INDEX_EDIT.remoteCluster}' is not connected`
      );
      expect(screen.getByTestId('remoteClusterFormField.notConnectedError.editButton')).toBeInTheDocument();
    });

    test('should prevent saving the form and display an error message for the required remote cluster', () => {
      actions.clickSaveForm();

      expect(form.getErrorsMessages()).toEqual(['A connected remote cluster is required.']);
      expect(screen.getByTestId('submitButton')).toBeDisabled();
    });
  });
});
