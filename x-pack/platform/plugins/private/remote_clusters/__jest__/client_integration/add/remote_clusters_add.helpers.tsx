/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpSetup } from '@kbn/core/public';

import { RemoteClusterAdd } from '../../../public/application/sections';
import { createRemoteClustersStore } from '../../../public/application/store';
import type { AppRouter } from '../../../public/application/services';
import { registerRouter } from '../../../public/application/services';
import { renderWithRouter, WithAppDependencies } from '../helpers';

export const setup = (httpSetup: HttpSetup, overrides?: Record<string, unknown>) => {
  return renderWithRouter(WithAppDependencies(RemoteClusterAdd, httpSetup, overrides), {
    store: createRemoteClustersStore(),
    onRouter: (router: AppRouter) => registerRouter(router),
  });
};
