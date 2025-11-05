/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, waitFor } from '@testing-library/react';
import { setupEnvironment } from './helpers';
import { getPolicy } from '../../test/fixtures';
import type { PoliciesListTestBed } from './helpers/policy_list.helpers';
import { setupPoliciesListPage } from './helpers/policy_list.helpers';

const POLICY_WITH_GLOBAL_STATE_AND_FEATURES = getPolicy({
  name: 'with_state',
  retention: { minCount: 1 },
  config: { includeGlobalState: true, featureStates: ['kibana'] },
});
const POLICY_WITHOUT_GLOBAL_STATE = getPolicy({
  name: 'without_state',
  retention: { minCount: 1 },
  config: { includeGlobalState: false },
});

const POLICY_WITH_JUST_GLOBAL_STATE = getPolicy({
  name: 'without_state',
  retention: { minCount: 1 },
  config: { includeGlobalState: true },
});

describe('<PolicyList />', () => {
  let testBed: PoliciesListTestBed;
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeEach(() => {
    httpRequestsMockHelpers.setLoadPoliciesResponse({
      policies: [
        POLICY_WITH_GLOBAL_STATE_AND_FEATURES,
        POLICY_WITHOUT_GLOBAL_STATE,
        POLICY_WITH_JUST_GLOBAL_STATE,
      ],
    });
    httpRequestsMockHelpers.setGetPolicyResponse(POLICY_WITH_GLOBAL_STATE_AND_FEATURES.name, {
      policy: POLICY_WITH_GLOBAL_STATE_AND_FEATURES,
    });

    testBed = setupPoliciesListPage(httpSetup);
  });

  describe('details flyout', () => {
    test('should show the detail flyout when clicking on a policy', async () => {
      const { actions, user } = testBed;

      expect(screen.queryByTestId('policyDetail')).not.toBeInTheDocument();

      await actions.clickPolicyAt(0);

      await waitFor(() => {
        expect(screen.getByTestId('policyDetail')).toBeInTheDocument();
      });
    });

    test('should show feature states if include global state is enabled', async () => {
      const { actions, user } = testBed;

      // Assert against first result shown in the table, which should have includeGlobalState enabled
      await actions.clickPolicyAt(0);

      await waitFor(() => {
        expect(screen.getByTestId('includeGlobalState.value')).toHaveTextContent('Yes');
        expect(screen.getByTestId('policyFeatureStatesSummary.featureStatesList')).toHaveTextContent('kibana');
      });

      // Close the flyout
      const closeButton = screen.getByTestId('srPolicyDetailsFlyoutCloseButton');
      await user.click(closeButton);

      // Replace the get policy details api call with the payload of the second row which we're about to click
      httpRequestsMockHelpers.setGetPolicyResponse(POLICY_WITHOUT_GLOBAL_STATE.name, {
        policy: POLICY_WITHOUT_GLOBAL_STATE,
      });

      // Now we will assert against the second result of the table which shouldnt have includeGlobalState
      await actions.clickPolicyAt(1);

      await waitFor(() => {
        expect(screen.getByTestId('includeGlobalState.value')).toHaveTextContent('No');
        expect(screen.getByTestId('policyFeatureStatesSummary.value')).toHaveTextContent('No');
      });

      // Close the flyout
      const closeButton2 = screen.getByTestId('srPolicyDetailsFlyoutCloseButton');
      await user.click(closeButton2);
    });

    test('When it only has include globalState summary should also mention that it includes all features', async () => {
      const { actions } = testBed;

      // Replace the get policy details api call with the payload of the second row which we're about to click
      httpRequestsMockHelpers.setGetPolicyResponse(POLICY_WITH_JUST_GLOBAL_STATE.name, {
        policy: POLICY_WITH_JUST_GLOBAL_STATE,
      });

      // Assert against third result shown in the table, which should have just includeGlobalState enabled
      await actions.clickPolicyAt(2);

      await waitFor(() => {
        expect(screen.getByTestId('includeGlobalState.value')).toHaveTextContent('Yes');
        expect(screen.getByTestId('policyFeatureStatesSummary.value')).toHaveTextContent('All features');
      });
    });
  });
});
