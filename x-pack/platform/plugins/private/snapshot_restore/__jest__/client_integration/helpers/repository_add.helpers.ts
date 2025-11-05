/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import type { HttpSetup } from '@kbn/core/public';
import type { RepositoryType } from '../../../common/types';
import { RepositoryAdd } from '../../../public/application/sections/repository_add';
import { renderWithRouter } from './setup_environment';
import type { RenderWithProvidersResult } from './setup_environment';

export interface RepositoryAddTestBed extends RenderWithProvidersResult {
  actions: {
    clickNextButton: () => Promise<void>;
    clickBackButton: () => Promise<void>;
    clickSubmitButton: () => Promise<void>;
    selectRepositoryType: (type: RepositoryType) => Promise<void>;
  };
}

export const setup = (httpSetup: HttpSetup): RepositoryAddTestBed => {
  const renderResult = renderWithRouter(<RepositoryAdd />, {
    httpSetup,
  });

  const { user } = renderResult;

  // User actions
  const clickNextButton = async () => {
    const button = screen.getByTestId('nextButton');
    await user.click(button);
  };

  const clickBackButton = async () => {
    const button = screen.getByTestId('backButton');
    await user.click(button);
  };

  const clickSubmitButton = async () => {
    const button = screen.getByTestId('submitButton');
    await user.click(button);
  };

  const selectRepositoryType = async (type: RepositoryType) => {
    const button = screen.getByTestId(`${type}RepositoryType`).querySelector('button');
    if (!button) {
      throw new Error(`Repository type "${type}" button not found.`);
    }
    await user.click(button);
  };

  return {
    ...renderResult,
    actions: {
      clickNextButton,
      clickBackButton,
      clickSubmitButton,
      selectRepositoryType,
    },
  };
};

export type RepositoryAddTestSubjects = TestSubjects | NonVisibleTestSubjects;

type NonVisibleTestSubjects =
  | 'noRepositoryTypesError'
  | 'sectionLoading'
  | 'saveRepositoryApiError';

type TestSubjects =
  | 'backButton'
  | 'chunkSizeInput'
  | 'compressToggle'
  | 'fsRepositoryType'
  | 'locationInput'
  | 'clientInput'
  | 'containerInput'
  | 'basePathInput'
  | 'bucketInput'
  | 'pathInput'
  | 'uriInput'
  | 'bufferSizeInput'
  | 'maxRestoreBytesInput'
  | 'maxSnapshotBytesInput'
  | 'nameInput'
  | 'nextButton'
  | 'pageTitle'
  | 'readOnlyToggle'
  | 'repositoryForm'
  | 'repositoryForm.backButton'
  | 'repositoryForm.chunkSizeInput'
  | 'repositoryForm.compressToggle'
  | 'repositoryForm.fsRepositoryType'
  | 'repositoryForm.locationInput'
  | 'repositoryForm.maxRestoreBytesInput'
  | 'repositoryForm.maxSnapshotBytesInput'
  | 'repositoryForm.nameInput'
  | 'repositoryForm.nextButton'
  | 'repositoryForm.readOnlyToggle'
  | 'repositoryForm.repositoryFormError'
  | 'repositoryForm.sourceOnlyToggle'
  | 'repositoryForm.stepTwo'
  | 'repositoryForm.submitButton'
  | 'repositoryForm.title'
  | 'repositoryForm.urlRepositoryType'
  | 'repositoryFormError'
  | 'snapshotRestoreApp'
  | 'snapshotRestoreApp.backButton'
  | 'snapshotRestoreApp.chunkSizeInput'
  | 'snapshotRestoreApp.compressToggle'
  | 'snapshotRestoreApp.fsRepositoryType'
  | 'snapshotRestoreApp.locationInput'
  | 'snapshotRestoreApp.maxRestoreBytesInput'
  | 'snapshotRestoreApp.maxSnapshotBytesInput'
  | 'snapshotRestoreApp.nameInput'
  | 'snapshotRestoreApp.nextButton'
  | 'snapshotRestoreApp.pageTitle'
  | 'snapshotRestoreApp.readOnlyToggle'
  | 'snapshotRestoreApp.repositoryForm'
  | 'snapshotRestoreApp.repositoryFormError'
  | 'snapshotRestoreApp.sourceOnlyToggle'
  | 'snapshotRestoreApp.stepTwo'
  | 'snapshotRestoreApp.submitButton'
  | 'snapshotRestoreApp.title'
  | 'snapshotRestoreApp.urlRepositoryType'
  | 'sourceOnlyToggle'
  | 'stepTwo'
  | 'stepTwo.backButton'
  | 'stepTwo.chunkSizeInput'
  | 'stepTwo.compressToggle'
  | 'stepTwo.locationInput'
  | 'stepTwo.maxRestoreBytesInput'
  | 'stepTwo.maxSnapshotBytesInput'
  | 'stepTwo.readOnlyToggle'
  | 'stepTwo.submitButton'
  | 'stepTwo.title'
  | 'storageClassSelect'
  | 'submitButton'
  | 'title'
  | 'urlRepositoryType';
