/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { screen } from '@testing-library/react';

import { API_BASE_PATH } from '../../common';
import { pageHelpers, setupEnvironment } from './helpers';
import type { RestoreSnapshotTestBed } from './helpers/restore_snapshot.helpers';
import { REPOSITORY_NAME, SNAPSHOT_NAME } from './helpers/constant';
import { FEATURE_STATES_NONE_OPTION } from '../../common/constants';
import * as fixtures from '../../test/fixtures';

const {
  restoreSnapshot: { setup },
} = pageHelpers;

describe('<RestoreSnapshot />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();
  let testBed: RestoreSnapshotTestBed;

  describe('wizard navigation', () => {
    beforeEach(() => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot()
      );

      testBed = setup(httpSetup);
    });

    it('does not allow navigation when the step is invalid', async () => {
      const { actions } = testBed;
      await actions.goToStep(2);
      expect(actions.canGoToADifferentStep()).toBe(true);
      await actions.toggleModifyIndexSettings();
      expect(actions.canGoToADifferentStep()).toBe(false);
    });
  });

  describe('with data streams', () => {
    beforeEach(() => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot()
      );

      testBed = setup(httpSetup);
    });

    test('shows the data streams warning when the snapshot has data streams', () => {
      expect(screen.queryByTestId('dataStreamWarningCallOut')).toBeInTheDocument();
    });
  });

  describe('without data streams', () => {
    beforeEach(() => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot({ totalDataStreams: 0 })
      );
      testBed = setup(httpSetup);
    });

    test('hides the data streams warning when the snapshot has data streams', () => {
      expect(screen.queryByTestId('dataStreamWarningCallOut')).not.toBeInTheDocument();
    });
  });

  describe('feature states', () => {
    test('when no feature states hide dropdown and show no features callout', async () => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot({ featureStates: [] })
      );

      testBed = setup(httpSetup);

      const { actions } = testBed;

      await actions.toggleGlobalState();
      expect(screen.queryByTestId('systemIndicesInfoCallOut')).not.toBeInTheDocument();
      expect(screen.queryByTestId('featureStatesDropdown')).not.toBeInTheDocument();
      expect(screen.queryByTestId('noFeatureStatesCallout')).toBeInTheDocument();
    });

    test('shows an extra info callout when includeFeatureState is enabled and we have featureStates present in snapshot', async () => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot({ featureStates: ['kibana'] })
      );

      testBed = setup(httpSetup);

      const { actions } = testBed;

      expect(screen.queryByTestId('systemIndicesInfoCallOut')).not.toBeInTheDocument();

      await actions.toggleFeatureState();

      expect(screen.queryByTestId('systemIndicesInfoCallOut')).toBeInTheDocument();
    });
  });

  // NOTE: This suite can be expanded to simulate the user setting non-default values for all of
  // the form controls and asserting that the correct payload is sent to the API.
  describe('include aliases', () => {
    beforeEach(() => {
      httpRequestsMockHelpers.setGetSnapshotResponse(
        REPOSITORY_NAME,
        SNAPSHOT_NAME,
        fixtures.getSnapshot()
      );

      testBed = setup(httpSetup);
    });

    test('is sent to the API', async () => {
      const { actions } = testBed;
      await actions.toggleIncludeAliases();
      await actions.goToStep(3);
      await actions.clickRestore();

      expect(httpSetup.post).toHaveBeenLastCalledWith(
        `${API_BASE_PATH}restore/${REPOSITORY_NAME}/${SNAPSHOT_NAME}`,
        expect.objectContaining({
          body: JSON.stringify({
            featureStates: [FEATURE_STATES_NONE_OPTION],
            includeAliases: false,
          }),
        })
      );
    });
  });
});
