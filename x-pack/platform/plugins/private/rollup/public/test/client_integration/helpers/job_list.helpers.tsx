/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { scopedHistoryMock } from '@kbn/core/public/mocks';
import { registerRouter } from '../../../crud_app/services';
import { createRollupJobsStore } from '../../../crud_app/store';
import { JobList } from '../../../crud_app/sections/job_list';
import { WithAppDependencies } from './setup_context';

export interface JobListSetupResult extends RenderResult {
  user: UserEvent;
}

export const setup = (props?: any): JobListSetupResult => {
  const user = userEventLib.default.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  // Create a scoped history mock
  const history = scopedHistoryMock.create();

  // Register the router
  registerRouter(history as any);

  const JobListWithDependencies = WithAppDependencies(JobList);

  // Create store
  const store = createRollupJobsStore();

  const renderResult = render(<JobListWithDependencies {...props} />, {
    wrapper: ({ children }) => <>{children}</>,
  });

  return {
    ...renderResult,
    user,
  };
};
