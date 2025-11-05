/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { registerRouter } from '../../../crud_app/services';
import { createRollupJobsStore } from '../../../crud_app/store';
import { JobList } from '../../../crud_app/sections/job_list';
import { renderWithProviders } from './setup_context';

export const setup = (props) => {
  const store = createRollupJobsStore();

  let routerInstance;
  
  const RouterWrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter
        ref={(router) => {
          if (router) {
            routerInstance = router.history;
            registerRouter(router.history);
          }
        }}
      >
        {children}
      </MemoryRouter>
    </Provider>
  );

  const renderResult = renderWithProviders(<JobList {...props} />, {
    wrapper: RouterWrapper,
  });

  return {
    ...renderResult,
    router: routerInstance,
  };
};
