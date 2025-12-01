/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import { setupEnvironment } from './helpers';
import { getPolicy } from '../../test/fixtures';
import type { PoliciesListSetupResult } from './helpers/policy_list.helpers';
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
  let renderResult: PoliciesListSetupResult;
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
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

    renderResult = await setupPoliciesListPage(httpSetup);
  });

  describe('details flyout', () => {
    test('should show the detail flyout when clicking on a policy', async () => {
      expect(screen.queryByTestId('policyDetail')).not.toBeInTheDocument();

      await renderResult.actions.clickPolicyAt(0);

      expect(await screen.findByTestId('policyDetail')).toBeInTheDocument();
    });

    test('should show feature states if include global state is enabled', async () => {
      // Assert against first result shown in the table, which should have includeGlobalState enabled
      await renderResult.actions.clickPolicyAt(0);

      const includeGlobalState = await screen.findByTestId('includeGlobalState.value');
      expect(includeGlobalState).toHaveTextContent('Yes');

      const featureStates = screen.getByTestId('policyFeatureStatesSummary.featureStatesList');
      expect(featureStates).toHaveTextContent('kibana');

      // Close the flyout
      const closeButton = screen.getByTestId('srPolicyDetailsFlyoutCloseButton');
      await renderResult.user.click(closeButton);

      // Replace the get policy details api call with the payload of the second row which we're about to click
      httpRequestsMockHelpers.setGetPolicyResponse(POLICY_WITHOUT_GLOBAL_STATE.name, {
        policy: POLICY_WITHOUT_GLOBAL_STATE,
      });

      // Now we will assert against the second result of the table which shouldnt have includeGlobalState
      await renderResult.actions.clickPolicyAt(1);

      const includeGlobalState2 = await screen.findByTestId('includeGlobalState.value');
      expect(includeGlobalState2).toHaveTextContent('No');

      const featureStatesSummary = screen.getByTestId('policyFeatureStatesSummary.value');
      expect(featureStatesSummary).toHaveTextContent('No');

      // Close the flyout
      const closeButton2 = screen.getByTestId('srPolicyDetailsFlyoutCloseButton');
      await renderResult.user.click(closeButton2);
    });

    test('When it only has include globalState summary should also mention that it includes all features', async () => {
      // Replace the get policy details api call with the payload of the second row which we're about to click
      httpRequestsMockHelpers.setGetPolicyResponse(POLICY_WITH_JUST_GLOBAL_STATE.name, {
        policy: POLICY_WITH_JUST_GLOBAL_STATE,
      });

      // Assert against third result shown in the table, which should have just includeGlobalState enabled
      await renderResult.actions.clickPolicyAt(2);

      const includeGlobalState = await screen.findByTestId('includeGlobalState.value');
      expect(includeGlobalState).toHaveTextContent('Yes');

      const featureStatesSummary = screen.getByTestId('policyFeatureStatesSummary.value');
      expect(featureStatesSummary).toHaveTextContent('All features');
    });
  });
});
