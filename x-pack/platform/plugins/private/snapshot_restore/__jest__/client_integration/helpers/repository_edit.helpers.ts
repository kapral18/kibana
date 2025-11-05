/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { HttpSetup } from '@kbn/core/public';
import { RepositoryEdit } from '../../../public/application/sections/repository_edit';
import { renderWithRouter } from './setup_environment';
import { REPOSITORY_NAME } from './constant';

export const setup = (httpSetup: HttpSetup) => {
  return renderWithRouter(<RepositoryEdit />, {
    initialEntries: [`/${REPOSITORY_NAME}`],
    httpSetup,
  });
};

export type RepositoryEditTestSubjects = TestSubjects | ThreeLevelDepth | NonVisibleTestSubjects;

type NonVisibleTestSubjects =
  | 'uriInput'
  | 'schemeSelect'
  | 'clientInput'
  | 'containerInput'
  | 'basePathInput'
  | 'maxSnapshotBytesInput'
  | 'locationModeSelect'
  | 'bucketInput'
  | 'urlInput'
  | 'pathInput'
  | 'loadDefaultsToggle'
  | 'securityPrincipalInput'
  | 'serverSideEncryptionToggle'
  | 'bufferSizeInput'
  | 'cannedAclSelect'
  | 'storageClassSelect';

type ThreeLevelDepth = 'repositoryForm.stepTwo.title';

type TestSubjects =
  | 'chunkSizeInput'
  | 'compressToggle'
  | 'locationInput'
  | 'maxRestoreBytesInput'
  | 'maxSnapshotBytesInput'
  | 'readOnlyToggle'
  | 'repositoryForm'
  | 'repositoryForm.chunkSizeInput'
  | 'repositoryForm.compressToggle'
  | 'repositoryForm.locationInput'
  | 'repositoryForm.maxRestoreBytesInput'
  | 'repositoryForm.maxSnapshotBytesInput'
  | 'repositoryForm.readOnlyToggle'
  | 'repositoryForm.stepTwo'
  | 'repositoryForm.submitButton'
  | 'repositoryForm.title'
  | 'snapshotRestoreApp'
  | 'snapshotRestoreApp.chunkSizeInput'
  | 'snapshotRestoreApp.compressToggle'
  | 'snapshotRestoreApp.locationInput'
  | 'snapshotRestoreApp.maxRestoreBytesInput'
  | 'snapshotRestoreApp.maxSnapshotBytesInput'
  | 'snapshotRestoreApp.readOnlyToggle'
  | 'snapshotRestoreApp.repositoryForm'
  | 'snapshotRestoreApp.stepTwo'
  | 'snapshotRestoreApp.submitButton'
  | 'snapshotRestoreApp.title'
  | 'stepTwo'
  | 'stepTwo.chunkSizeInput'
  | 'stepTwo.compressToggle'
  | 'stepTwo.locationInput'
  | 'stepTwo.maxRestoreBytesInput'
  | 'stepTwo.maxSnapshotBytesInput'
  | 'stepTwo.readOnlyToggle'
  | 'stepTwo.submitButton'
  | 'stepTwo.title'
  | 'submitButton'
  | 'codeEditor'
  | 'title';
