/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Pager } from '@elastic/eui';
import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../../../test/client_integration/helpers/setup_context';
import { getJobs, jobCount } from '../../../../../fixtures';
import { rollupJobsStore } from '../../../store';
import { JobTable } from './job_table';

jest.mock('../../../../kibana_services', () => {
  const services = jest.requireActual('../../../../kibana_services');
  return {
    ...services,
    trackUiMetric: jest.fn(),
  };
});

jest.mock('../../../services', () => {
  const services = jest.requireActual('../../../services');
  return {
    ...services,
    getRouterLinkProps: (link) => ({ href: link }),
  };
});

const defaultProps = {
  jobs: [],
  pager: new Pager(20, 10, 1),
  filter: '',
  sortField: '',
  isSortAscending: false,
  openDetailPanel: () => {},
  closeDetailPanel: () => {},
  filterChanged: () => {},
  pageChanged: () => {},
  pageSizeChanged: () => {},
  sortChanged: () => {},
};

const renderJobTable = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  
  const Wrapper = ({ children }) => (
    <Provider store={rollupJobsStore}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </Provider>
  );

  return renderWithProviders(<JobTable {...mergedProps} />, { wrapper: Wrapper });
};

describe('<JobTable />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('table rows', () => {
    const totalJobs = jobCount;
    const jobs = getJobs(totalJobs);
    const openDetailPanel = jest.fn();
    
    beforeEach(() => {
      renderJobTable({ jobs, openDetailPanel });
    });

    it('should create 1 table row per job', () => {
      const tableRows = screen.getAllByTestId('jobTableRow');
      expect(tableRows.length).toEqual(totalJobs);
    });

    it('should create the expected 8 columns for each row', () => {
      const expectedColumns = [
        'id',
        'status',
        'indexPattern',
        'rollupIndex',
        'rollupDelay',
        'dateHistogramInterval',
        'groups',
        'metrics',
      ];

      expectedColumns.forEach((columnId) => {
        expect(screen.getByTestId(`jobTableHeaderCell-${columnId}`)).toBeInTheDocument();
      });
    });

    it('should set the correct job value in each row cell', () => {
      const unformattedFields = [
        'id',
        'indexPattern',
        'rollupIndex',
        'rollupDelay',
        'dateHistogramInterval',
      ];
      
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[0];
      const job = jobs[0];

      unformattedFields.forEach((field) => {
        const cell = within(row).getByTestId(`jobTableCell-${field}`);
        expect(cell.textContent).toEqual(job[field]);
      });

      // Status
      const statusCell = within(row).getByTestId('jobTableCell-status');
      expect(job.status).toEqual('stopped');
      expect(statusCell.textContent).toEqual('Stopped');

      // Groups
      const groupsCell = within(row).getByTestId('jobTableCell-groups');
      expect(groupsCell.textContent).toEqual('Histogram, terms');

      // Metrics
      const expectedJobMetrics = job.metrics.reduce(
        (text, { name }) => (text ? `${text}, ${name}` : name),
        ''
      );
      const metricsCell = within(row).getByTestId('jobTableCell-metrics');
      expect(metricsCell.textContent).toEqual(expectedJobMetrics);
    });

    it('should open the detail panel when clicking on the job id', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[0];
      const job = jobs[0];
      const linkJobId = within(row).getByTestId('jobTableCell-id').querySelector('button');

      await user.click(linkJobId);

      expect(openDetailPanel).toHaveBeenCalledTimes(1);
      expect(openDetailPanel).toHaveBeenCalledWith(job.id);
    });

    it('should still render despite unknown job statuses', () => {
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[tableRows.length - 1];
      const statusCell = within(row).getByTestId('jobTableCell-status');
      // In job fixtures, the last job has unknown status
      expect(statusCell.textContent).toEqual('Unknown');
    });
  });

  describe('action menu', () => {
    let jobs;
    
    beforeEach(() => {
      jobs = getJobs();
      renderJobTable({ jobs });
    });

    const selectJob = async (user, index = 0) => {
      const job = jobs[index];
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[index];
      const checkBox = within(row).getByTestId(`indexTableRowCheckbox-${job.id}`);
      await user.click(checkBox);
    };

    it('should be visible when a job is selected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      expect(screen.queryByTestId('jobActionMenuButton')).not.toBeInTheDocument();

      await selectJob(user);

      expect(screen.getByTestId('jobActionMenuButton')).toBeInTheDocument();
    });

    it('should have a "start" and "delete" action for a job that is stopped', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const index = 0;
      const job = jobs[index];
      job.status = 'stopped';

      await selectJob(user, index);
      const menuButton = screen.getByTestId('jobActionMenuButton');
      await user.click(menuButton);

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      expect(contextMenu).toBeInTheDocument();

      expect(within(contextMenu).getByText('Start job')).toBeInTheDocument();
      expect(within(contextMenu).getByText('Delete job')).toBeInTheDocument();
    });

    it('should only have a "stop" action when the job is started', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const index = 0;
      const job = jobs[index];
      job.status = 'started';

      await selectJob(user, index);
      await user.click(screen.getByTestId('jobActionMenuButton'));

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      expect(within(contextMenu).getByText('Stop job')).toBeInTheDocument();
    });

    it('should offer both "start" and "stop" actions when selecting job with different a status', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const job1 = jobs[0];
      const job2 = jobs[1];
      job1.status = 'started';
      job2.status = 'stopped';

      await selectJob(user, 0);
      await selectJob(user, 1);
      await user.click(screen.getByTestId('jobActionMenuButton'));

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      expect(within(contextMenu).getByText('Start jobs')).toBeInTheDocument();
      expect(within(contextMenu).getByText('Stop jobs')).toBeInTheDocument();
    });
  });
});
