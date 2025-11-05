/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockHttpRequest, pageHelpers } from './helpers';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRouter, setHttp, init as initDocumentation } from '../../crud_app/services';
import { JOBS } from './helpers/constants';
import { coreMock, docLinksServiceMock } from '@kbn/core/public/mocks';

jest.mock('../../crud_app/services', () => {
  const services = jest.requireActual('../../crud_app/services');
  return {
    ...services,
    getRouterLinkProps: (link) => ({ href: link }),
  };
});

jest.mock('../../kibana_services', () => {
  const services = jest.requireActual('../../kibana_services');
  return {
    ...services,
    getUiStatsReporter: jest.fn(() => () => {}),
  };
});

const { setup } = pageHelpers.jobList;

describe('<JobList />', () => {
  describe('detail panel', () => {
    let startMock;

    beforeAll(() => {
      jest.useFakeTimers();
      startMock = coreMock.createStart();
      setHttp(startMock.http);
      initDocumentation(docLinksServiceMock.createStartContract());
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(async () => {
      mockHttpRequest(startMock.http, { jobs: JOBS });
      setup();
      await waitFor(() => {
        expect(screen.getByTestId('rollupJobsListTable')).toBeInTheDocument();
      });
    });

    afterEach(() => {
      startMock.http.get.mockClear();
    });

    test('should have a deprecation callout', () => {
      expect(screen.getByTestId('rollupDeprecationCallout')).toBeInTheDocument();
    });

    test('should open the detail panel when clicking on a job in the table', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const rows = screen.getAllByTestId('jobTableRow');
      const firstRowButton = rows[0].querySelector('button[data-test-subj="jobTableCell-id"] button');

      expect(screen.queryByTestId('rollupJobDetailFlyout')).not.toBeInTheDocument();

      await user.click(firstRowButton);

      await waitFor(() => {
        expect(screen.getByTestId('rollupJobDetailFlyout')).toBeInTheDocument();
      });
    });

    test('should add the Job id to the route query params when opening the detail panel', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      const rows = screen.getAllByTestId('jobTableRow');
      const firstRowButton = rows[0].querySelector('button[data-test-subj="jobTableCell-id"] button');

      expect(getRouter().history.location.search).toEqual('');

      await user.click(firstRowButton);

      await waitFor(() => {
        const {
          jobs: [
            {
              config: { id: jobId },
            },
          ],
        } = JOBS;
        expect(getRouter().history.location.search).toEqual(`?job=${jobId}`);
      });
    });

    test('should open the detail panel whenever a job id is added to the query params', () => {
      expect(screen.queryByTestId('rollupJobDetailFlyout')).not.toBeInTheDocument();

      getRouter().history.replace({ search: `?job=bar` });

      waitFor(() => {
        expect(screen.getByTestId('rollupJobDetailFlyout')).toBeInTheDocument();
      });
    });
  });
});
