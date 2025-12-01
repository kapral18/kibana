/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';

import { SECURITY_MODEL } from '../../../common/constants';
import type { Cluster } from '../../../public';
import { RemoteClusterEdit } from '../../../public/application/sections';
import { createRemoteClustersStore } from '../../../public/application/store';
import type { AppRouter } from '../../../public/application/services';
import { registerRouter } from '../../../public/application/services';
import { renderWithRouter, WithAppDependencies, createRemoteClustersActions } from '../helpers';

export const REMOTE_CLUSTER_EDIT_NAME = 'new-york';

export const REMOTE_CLUSTER_EDIT: Cluster = {
  name: REMOTE_CLUSTER_EDIT_NAME,
  seeds: ['localhost:9400'],
  skipUnavailable: true,
  securityModel: SECURITY_MODEL.CERTIFICATE,
};

export const setup = (httpSetup: HttpSetup, overrides?: Record<string, unknown>) => {
  const renderResult = renderWithRouter(WithAppDependencies(RemoteClusterEdit, httpSetup, overrides), {
    store: createRemoteClustersStore(),
    onRouter: (router: AppRouter) => registerRouter(router),
    initialEntries: [`/${REMOTE_CLUSTER_EDIT_NAME}`],
    routePath: '/:name',
  });
  
  return {
    ...renderResult,
    actions: createRemoteClustersActions(renderResult.user),
  };
};
