/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { createRollupJobsStore } from '../../../crud_app/store';
import { JobCreate } from '../../../crud_app/sections';
import { JOB_TO_CLONE } from './constants';
import { deserializeJob } from '../../../crud_app/services';
import { WithAppDependencies } from './setup_context';

export interface JobCloneSetupResult extends RenderResult {
  user: UserEvent;
  actions: {
    clickNextStep: () => Promise<void>;
  };
}

export const setup = (props?: any): JobCloneSetupResult => {
  const user = userEventLib.default.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  // Create store with cloneJob state
  const store = createRollupJobsStore({
    cloneJob: { job: deserializeJob(JOB_TO_CLONE.jobs[0]) },
  });

  const JobCreateWithDependencies = WithAppDependencies(JobCreate);
  const renderResult = render(<JobCreateWithDependencies {...props} />, {
    wrapper: ({ children }) => <>{children}</>,
  });

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
