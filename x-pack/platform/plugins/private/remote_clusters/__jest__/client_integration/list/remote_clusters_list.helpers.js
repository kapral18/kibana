/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderWithRouter, WithAppDependencies } from '../helpers';
import { RemoteClusterList } from '../../../public/application/sections/remote_cluster_list';
import { createRemoteClustersStore } from '../../../public/application/store';
import { registerRouter } from '../../../public/application/services/routing';

export const setup = (httpSetup, overrides) => {
  return renderWithRouter(WithAppDependencies(RemoteClusterList, httpSetup, overrides), {
    store: createRemoteClustersStore(),
    onRouter: (router) => registerRouter(router),
  });
};
