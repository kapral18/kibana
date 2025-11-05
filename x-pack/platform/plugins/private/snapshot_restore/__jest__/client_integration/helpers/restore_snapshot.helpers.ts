/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { screen } from '@testing-library/react';

import type { HttpSetup } from '@kbn/core/public';
import { RestoreSnapshot } from '../../../public/application/sections/restore_snapshot';
import { renderWithRouter } from './setup_environment';
import type { RenderWithProvidersResult } from './setup_environment';
import { REPOSITORY_NAME, SNAPSHOT_NAME } from './constant';

const setupActions = (renderResult: RenderWithProvidersResult) => {
  const { user } = renderResult;

  return {
    findDataStreamCallout() {
      return screen.queryByTestId('dataStreamWarningCallOut');
    },

    canGoToADifferentStep() {
      const nextButton = screen.queryByTestId('restoreSnapshotsForm.nextButton');
      const backButton = screen.queryByTestId('restoreSnapshotsForm.backButton');
      
      const canGoNext = nextButton ? !(nextButton as HTMLButtonElement).disabled : false;
      const canGoPrevious = backButton ? !(backButton as HTMLButtonElement).disabled : true;
      return canGoNext && canGoPrevious;
    },

    async toggleModifyIndexSettings() {
      const toggle = screen.getByTestId('modifyIndexSettingsSwitch');
      await user.click(toggle);
    },

    async toggleGlobalState() {
      const toggle = screen.getByTestId('includeGlobalStateSwitch');
      await user.click(toggle);
    },

    async toggleFeatureState() {
      const toggle = screen.getByTestId('includeFeatureStatesSwitch');
      await user.click(toggle);
    },

    async toggleIncludeAliases() {
      const toggle = screen.getByTestId('includeAliasesSwitch');
      await user.click(toggle);
    },

    async goToStep(step: number) {
      while (--step > 0) {
        const nextButton = screen.getByTestId('nextButton');
        await user.click(nextButton);
      }
    },

    async clickRestore() {
      const restoreButton = screen.getByTestId('restoreButton');
      await user.click(restoreButton);
    },
  };
};

type Actions = ReturnType<typeof setupActions>;

export type RestoreSnapshotTestBed = RenderWithProvidersResult & {
  actions: Actions;
};

export const setup = (httpSetup: HttpSetup): RestoreSnapshotTestBed => {
  const renderResult = renderWithRouter(<RestoreSnapshot />, {
    initialEntries: [`/restore/${REPOSITORY_NAME}/${SNAPSHOT_NAME}`],
    httpSetup,
  });

  return {
    ...renderResult,
    actions: setupActions(renderResult),
  };
};

export type RestoreSnapshotFormTestSubject =
  | 'snapshotRestoreStepLogistics'
  | 'includeGlobalStateSwitch'
  | 'includeAliasesSwitch'
  | 'featureStatesDropdown'
  | 'includeFeatureStatesSwitch'
  | 'toggleIncludeNone'
  | 'nextButton'
  | 'restoreButton'
  | 'systemIndicesInfoCallOut'
  | 'noFeatureStatesCallout'
  | 'dataStreamWarningCallOut'
  | 'restoreSnapshotsForm.backButton'
  | 'restoreSnapshotsForm.nextButton'
  | 'modifyIndexSettingsSwitch';
