/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import './mocks';
import { setupEnvironment, pageHelpers } from './helpers';

const { setup } = pageHelpers.home;

describe('<CrossClusterReplicationHome />', () => {
  let httpRequestsMockHelpers;
  let user;

  beforeAll(() => {
    jest.useFakeTimers();
    ({ httpRequestsMockHelpers } = setupEnvironment());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    // Set "default" mock responses by not providing any arguments
    httpRequestsMockHelpers.setLoadFollowerIndicesResponse();
  });

  describe('on component mount', () => {
    beforeEach(() => {
      setup();
    });

    test('should set the correct app title', () => {
      expect(screen.getByTestId('appTitle')).toBeInTheDocument();
      expect(screen.getByTestId('appTitle')).toHaveTextContent('Cross-Cluster Replication');
    });

    test('should have 2 tabs to switch between "Follower indices" & "Auto-follow patterns"', () => {
      expect(screen.getByTestId('followerIndicesTab')).toBeInTheDocument();
      expect(screen.getByTestId('followerIndicesTab')).toHaveTextContent('Follower indices');

      expect(screen.getByTestId('autoFollowPatternsTab')).toBeInTheDocument();
      expect(screen.getByTestId('autoFollowPatternsTab')).toHaveTextContent('Auto-follow patterns');
    });

    test('should set the default selected tab to "Follower indices"', () => {
      const selectedTab = screen.getByRole('tab', { selected: true });
      expect(selectedTab).toHaveTextContent('Follower indices');

      // Verify that the follower indices content is rendered
      expect(screen.getByTestId('followerIndexListTable')).toBeInTheDocument();
    });
  });

  describe('section change', () => {
    test('should change to auto-follow pattern', async () => {
      setup();

      const autoFollowPatternsTab = screen.getByTestId('autoFollowPatternsTab');
      await user.click(autoFollowPatternsTab);

      await waitFor(() => {
        const selectedTab = screen.getByRole('tab', { selected: true });
        expect(selectedTab).toHaveTextContent('Auto-follow patterns');
      });

      // Verify that the auto-follow patterns content is rendered
      expect(screen.getByTestId('autoFollowPatternListTable')).toBeInTheDocument();
    });
  });
});
