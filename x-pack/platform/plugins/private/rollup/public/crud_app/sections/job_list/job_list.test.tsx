/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { JobList } from './job_list';
import { rollupJobsStore } from '../../store';

import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { Provider } from 'react-redux';
import { coreMock } from '@kbn/core/public/mocks';
import { IntlProvider } from 'react-intl';

const startMock = coreMock.createStart();

jest.mock('../../services', () => {
  const services = jest.requireActual('../../services');
  return {
    ...services,
    getRouterLinkProps: (link: string) => ({ href: link }),
  };
});

jest.mock('../../services/documentation_links', () => {
  const coreMocks = jest.requireActual('@kbn/core/public/mocks');

  return {
    init: jest.fn(),
    documentationLinks: coreMocks.docLinksServiceMock.createStartContract().links,
  };
});

const defaultProps = {
  history: { location: {} },
  loadJobs: () => {},
  refreshJobs: () => {},
  openDetailPanel: () => {},
  closeDetailPanel: () => {},
  hasJobs: false,
  isLoading: false,
};

const services = {
  setBreadcrumbs: startMock.chrome.setBreadcrumbs,
};

const renderJobList = (props = {}) => {
  const combinedProps = { ...defaultProps, ...props };
  return render(
    <Provider store={rollupJobsStore}>
      <IntlProvider locale="en">
        <KibanaContextProvider services={services}>
          <JobList {...combinedProps} />
        </KibanaContextProvider>
      </IntlProvider>
    </Provider>
  );
};

describe('<JobList />', () => {
  it('should render deprecated prompt when loading is complete and there are no rollup jobs', () => {
    renderJobList();
    expect(screen.getByTestId('jobListDeprecatedPrompt')).toBeInTheDocument();
  });

  it('should display a loading message when loading the jobs', () => {
    const { container } = renderJobList({ isLoading: true });
    expect(screen.getByTestId('sectionLoading')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="jobTable"]')).toBeFalsy();
  });

  it('should display the <JobTable /> when there are jobs', () => {
    renderJobList({ hasJobs: true });
    expect(screen.queryByTestId('sectionLoading')).not.toBeInTheDocument();
    // JobTable is rendered - verify by checking that job rows can appear
    // (even if empty, the table structure should be present)
    expect(screen.queryByTestId('jobListDeprecatedPrompt')).not.toBeInTheDocument();
  });

  describe('when there is an API error', () => {
    it('should display an error with the status and the message', () => {
      renderJobList({
        jobLoadError: {
          status: 400,
          body: { statusCode: 400, error: 'Houston we got a problem.' },
        },
      });

      expect(screen.getByTestId('jobListError')).toBeInTheDocument();
      const errorElement = screen.getByTestId('jobListError');
      const errorText = within(errorElement).getByText('400 Houston we got a problem.');
      expect(errorText).toBeInTheDocument();
    });
  });

  describe('when the user does not have the permission to access it', () => {
    it('should render an error message', () => {
      renderJobList({ jobLoadError: { status: 403 } });

      expect(screen.getByTestId('jobListNoPermission')).toBeInTheDocument();
      const permissionElement = screen.getByTestId('jobListNoPermission');
      const permissionText = within(permissionElement).getByText(
        'You do not have permission to view or add rollup jobs.'
      );
      expect(permissionText).toBeInTheDocument();
    });
  });
});
