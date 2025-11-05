/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { createRollupJobsStore } from '../../../crud_app/store';
import { JobCreate } from '../../../crud_app/sections';
import { JOB_TO_CLONE } from './constants';
import { deserializeJob } from '../../../crud_app/services';
import { renderWithProviders } from './setup_context';

export const setup = (props) => {
  const store = createRollupJobsStore({
    cloneJob: { job: deserializeJob(JOB_TO_CLONE.jobs[0]) },
  });

  const RouterWrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  const { user, ...renderResult } = renderWithProviders(<JobCreate {...props} />, {
    wrapper: RouterWrapper,
  });

  // User actions
  const clickNextStep = async () => {
    const button = screen.getByTestId('rollupJobNextButton');
    await user.click(button);
  };

  return {
    ...renderResult,
    user,
    actions: {
      clickNextStep,
    },
  };
};
