/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Pager } from '@elastic/eui';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { renderWithI18n } from '@kbn/test-jest-helpers';

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

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
});

const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

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

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return renderWithI18n(
    <Provider store={rollupJobsStore}>
      <JobTable {...mergedProps} />
    </Provider>
  );
};

describe('<JobTable />', () => {
  describe('table rows', () => {
    const totalJobs = jobCount;
    const jobs = getJobs(totalJobs);
    const openDetailPanel = jest.fn();

    beforeEach(() => {
      renderComponent({ jobs, openDetailPanel });
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

      const tableColumns = expectedColumns.filter((columnId) => {
        return screen.queryByTestId(`jobTableHeaderCell-${columnId}`) !== null;
      });

      expect(tableColumns).toEqual(expectedColumns);
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
        expect(cell).toHaveTextContent(job[field]);
      });

      // Status
      const statusCell = within(row).getByTestId('jobTableCell-status');
      expect(job.status).toEqual('stopped'); // make sure the job status *is* "stopped"
      expect(statusCell).toHaveTextContent('Stopped');

      // Groups
      const groupsCell = within(row).getByTestId('jobTableCell-groups');
      expect(groupsCell).toHaveTextContent('Histogram, terms');

      // Metrics
      const expectedJobMetrics = job.metrics.reduce(
        (text, { name }) => (text ? `${text}, ${name}` : name),
        ''
      );
      const metricsCell = within(row).getByTestId('jobTableCell-metrics');
      expect(metricsCell).toHaveTextContent(expectedJobMetrics);
    });

    it('should open the detail panel when clicking on the job id', async () => {
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[0];
      const job = jobs[0];
      const idCell = within(row).getByTestId('jobTableCell-id');
      const linkButton = within(idCell).getByRole('button');

      await user.click(linkButton);

      expect(openDetailPanel).toHaveBeenCalledTimes(1);
      expect(openDetailPanel).toHaveBeenCalledWith(job.id);
    });

    it('should still render despite unknown job statuses', () => {
      const tableRows = screen.getAllByTestId('jobTableRow');
      const lastRow = tableRows[tableRows.length - 1];
      const statusCell = within(lastRow).getByTestId('jobTableCell-status');
      // In job fixtures, the last job has unknown status
      expect(statusCell).toHaveTextContent('Unknown');
    });
  });

  describe('action menu', () => {
    let jobs;

    const selectJob = async (index = 0) => {
      const job = jobs[index];
      const tableRows = screen.getAllByTestId('jobTableRow');
      const row = tableRows[index];
      const checkBox = within(row).getByTestId(`indexTableRowCheckbox-${job.id}`);
      await user.click(checkBox);
    };

    beforeEach(() => {
      jobs = getJobs();
      renderComponent({ jobs });
    });

    it('should be visible when a job is selected', async () => {
      expect(screen.queryByTestId('jobActionMenuButton')).not.toBeInTheDocument();

      await selectJob();

      expect(screen.getByTestId('jobActionMenuButton')).toBeInTheDocument();
    });

    it('should have a "start" and "delete" action for a job that is stopped', async () => {
      const index = 0;
      const job = jobs[index];
      job.status = 'stopped';

      await selectJob(index);
      const menuButton = screen.getByTestId('jobActionMenuButton');
      await user.click(menuButton); // open the context menu

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      expect(contextMenu).toBeInTheDocument();

      const contextMenuButtons = within(contextMenu).getAllByRole('button');
      const buttonsLabel = contextMenuButtons.map((btn) => btn.textContent);
      const hasExpectedLabels = ['Start job', 'Delete job'].every((expectedLabel) =>
        buttonsLabel.includes(expectedLabel)
      );

      expect(hasExpectedLabels).toBe(true);
    });

    it('should only have a "stop" action when the job is started', async () => {
      const index = 0;
      const job = jobs[index];
      job.status = 'started';

      await selectJob(index);
      const menuButton = screen.getByTestId('jobActionMenuButton');
      await user.click(menuButton);

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      const contextMenuButtons = within(contextMenu).getAllByRole('button');
      const buttonsLabel = contextMenuButtons.map((btn) => btn.textContent);
      const hasExpectedLabels = buttonsLabel.includes('Stop job');
      expect(hasExpectedLabels).toBe(true);
    });

    it('should offer both "start" and "stop" actions when selecting job with different a status', async () => {
      const job1 = jobs[0];
      const job2 = jobs[1];
      job1.status = 'started';
      job2.status = 'stopped';

      await selectJob(0);
      await selectJob(1);
      const menuButton = screen.getByTestId('jobActionMenuButton');
      await user.click(menuButton);

      const contextMenu = screen.getByTestId('jobActionContextMenu');
      const contextMenuButtons = within(contextMenu).getAllByRole('button');
      const buttonsLabel = contextMenuButtons.map((btn) => btn.textContent);
      const hasExpectedLabels = ['Start jobs', 'Stop jobs'].every((expectedLabel) =>
        buttonsLabel.includes(expectedLabel)
      );

      expect(hasExpectedLabels).toBe(true);
    });
  });
});
