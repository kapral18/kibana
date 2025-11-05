/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockHttpRequest, pageHelpers } from './helpers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JOB_TO_CLONE, JOB_CLONE_INDEX_PATTERN_CHECK } from './helpers/constants';
import { getRouter } from '../../crud_app/services/routing';
import { setHttp } from '../../crud_app/services';
import { coreMock } from '@kbn/core/public/mocks';

jest.mock('../../kibana_services', () => {
  const services = jest.requireActual('../../kibana_services');
  return {
    ...services,
    getUiStatsReporter: jest.fn(() => () => {}),
  };
});

const { setup } = pageHelpers.jobList;

describe('Smoke test cloning an existing rollup job from job list', () => {
  let startMock;

  beforeAll(() => {
    jest.useFakeTimers();
    startMock = coreMock.createStart();
    setHttp(startMock.http);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    mockHttpRequest(startMock.http, {
      jobs: JOB_TO_CLONE,
      indxPatternVldtResp: JOB_CLONE_INDEX_PATTERN_CHECK,
    });

    setup();
    
    await waitFor(() => {
      expect(screen.getByTestId('rollupJobsListTable')).toBeInTheDocument();
    });
  });

  afterEach(() => {
    startMock.http.get.mockClear();
  });

  it('should navigate to create view with default values set', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const router = getRouter();
    
    const rows = screen.getAllByTestId('jobTableRow');
    const firstRowButton = rows[0].querySelector('button[data-test-subj="jobTableCell-id"] button');

    expect(screen.queryByTestId('rollupJobDetailFlyout')).not.toBeInTheDocument();

    await user.click(firstRowButton);

    await waitFor(() => {
      expect(screen.getByTestId('rollupJobDetailFlyout')).toBeInTheDocument();
    });

    expect(screen.getByTestId('jobActionMenuButton')).toBeInTheDocument();

    await user.click(screen.getByTestId('jobActionMenuButton'));

    expect(router.history.location.pathname).not.toBe(`/create`);
    
    await user.click(screen.getByTestId('jobCloneActionContextMenu'));
    
    await waitFor(() => {
      expect(router.history.location.pathname).toBe(`/create`);
    });
  });
});
