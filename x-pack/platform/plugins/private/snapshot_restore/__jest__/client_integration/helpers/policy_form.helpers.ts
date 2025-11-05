/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { RenderWithProvidersResult } from './setup_environment';

export interface PolicyFormTestBed extends RenderWithProvidersResult {
  actions: {
    clickNextButton: () => Promise<void>;
    clickSubmitButton: () => Promise<void>;
  };
}

export const formSetup = (renderResult: RenderWithProvidersResult): PolicyFormTestBed => {
  const { user } = renderResult;

  // User actions
  const clickNextButton = async () => {
    const button = screen.getByTestId('nextButton');
    await user.click(button);
  };

  const clickSubmitButton = async () => {
    const button = screen.getByTestId('submitButton');
    await user.click(button);
  };

  return {
    ...renderResult,
    actions: {
      clickNextButton,
      clickSubmitButton,
    },
  };
};

export type PolicyFormTestSubjects =
  | 'advancedCronInput'
  | 'allIndicesToggle'
  | 'globalStateToggle'
  | 'featureStatesDropdown'
  | 'toggleIncludeNone'
  | 'noFeatureStatesCallout'
  | 'featureStatesToggle'
  | 'backButton'
  | 'deselectIndicesLink'
  | 'allDataStreamsToggle'
  | 'deselectDataStreamLink'
  | 'expireAfterValueInput'
  | 'expireAfterUnitSelect'
  | 'ignoreUnavailableIndicesToggle'
  | 'nameInput'
  | 'maxCountInput'
  | 'minCountInput'
  | 'nextButton'
  | 'pageTitle'
  | 'savePolicyApiError'
  | 'selectIndicesLink'
  | 'showAdvancedCronLink'
  | 'snapshotNameInput'
  | 'dataStreamBadge'
  | 'repositoryNotFoundWarning'
  | 'repositorySelect'
  | 'submitButton';
