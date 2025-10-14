/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, act } from '@testing-library/react';
import './mocks';
import { setupEnvironment, pageHelpers } from './helpers';
import { AUTO_FOLLOW_PATTERN_EDIT, AUTO_FOLLOW_PATTERN_EDIT_NAME } from './helpers/constants';

const { setup } = pageHelpers.autoFollowPatternEdit;
const { setup: setupAutoFollowPatternAdd } = pageHelpers.autoFollowPatternAdd;

describe('Edit Auto-follow pattern', () => {
  let httpRequestsMockHelpers;

  beforeAll(() => {
    jest.useFakeTimers();
    ({ httpRequestsMockHelpers } = setupEnvironment());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on component mount', () => {
    const remoteClusters = [
      { name: 'cluster-1', seeds: ['localhost:123'], isConnected: true },
      { name: 'cluster-2', seeds: ['localhost:123'], isConnected: true },
    ];

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);
      httpRequestsMockHelpers.setGetAutoFollowPatternResponse(
        AUTO_FOLLOW_PATTERN_EDIT_NAME,
        AUTO_FOLLOW_PATTERN_EDIT
      );
      setup();

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    /**
     * As the "edit" auto-follow pattern component uses the same form underneath that
     * the "create" auto-follow pattern, we won't test it again but simply make sure that
     * the form component is indeed shared between the 2 app sections.
     */
    test('should use the same Form component as the "<AutoFollowPatternAdd />" component', async () => {
      setupAutoFollowPatternAdd();

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      // Both components should render the auto-follow pattern form
      const forms = screen.getAllByTestId('autoFollowPatternForm');
      expect(forms.length).toBeGreaterThanOrEqual(2);
    });

    test('should populate the form fields with the values from the auto-follow pattern loaded', () => {
      expect(screen.getByTestId('nameInput')).toHaveValue(AUTO_FOLLOW_PATTERN_EDIT.name);
      expect(screen.getByTestId('remoteClusterInput')).toHaveValue(AUTO_FOLLOW_PATTERN_EDIT.remoteCluster);
      expect(screen.getByTestId('indexPatternInput')).toHaveTextContent(
        AUTO_FOLLOW_PATTERN_EDIT.leaderIndexPatterns.join('')
      );
      expect(screen.getByTestId('prefixInput')).toHaveValue('prefix_');
      expect(screen.getByTestId('suffixInput')).toHaveValue('_suffix');
    });
  });

  describe('when the remote cluster is disconnected', () => {
    let actions;
    let form;

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse([
        { name: 'cluster-2', seeds: ['localhost:123'], isConnected: false },
      ]);
      httpRequestsMockHelpers.setGetAutoFollowPatternResponse(
        AUTO_FOLLOW_PATTERN_EDIT_NAME,
        AUTO_FOLLOW_PATTERN_EDIT
      );
      ({ actions, form } = setup());

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });

    test('should display an error and have a button to edit the remote cluster', () => {
      const error = screen.getByTestId('notConnectedError');

      expect(error).toBeInTheDocument();
      const title = error.querySelector('.euiCallOutHeader__title');
      expect(title).toHaveTextContent(
        `Can't edit auto-follow pattern because remote cluster '${AUTO_FOLLOW_PATTERN_EDIT.remoteCluster}' is not connected`
      );
      expect(screen.getByTestId('notConnectedError.editButton')).toBeInTheDocument();
    });

    test('should prevent saving the form and display an error message for the required remote cluster', () => {
      actions.clickSaveForm();

      expect(form.getErrorsMessages()).toEqual(['A connected remote cluster is required.']);
      expect(screen.getByTestId('submitButton')).toBeDisabled();
    });
  });
});
