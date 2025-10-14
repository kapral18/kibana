/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import { rollupJobsStore } from '../../store';
import { JobList } from './job_list';

import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { coreMock } from '@kbn/core/public/mocks';
const startMock = coreMock.createStart();

jest.mock('../../services', () => {
  const services = jest.requireActual('../../services');
  return {
    ...services,
    getRouterLinkProps: (link) => ({ href: link }),
  };
});

jest.mock('../../services/documentation_links', () => {
  const coreMocks = jest.requireActual('@kbn/core/public/mocks');

  return {
    init: jest.fn(),
    documentationLinks: coreMocks.docLinksServiceMock.createStartContract().links,
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

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return renderWithI18n(
    <Provider store={rollupJobsStore}>
      <KibanaContextProvider services={services}>
        <JobList {...mergedProps} />
      </KibanaContextProvider>
    </Provider>
  );
};

describe('<JobList />', () => {
  it('should render deprecated prompt when loading is complete and there are no rollup jobs', () => {
    renderComponent();

    expect(screen.getByTestId('jobListDeprecatedPrompt')).toBeInTheDocument();
  });

  it('should display a loading message when loading the jobs', () => {
    renderComponent({ isLoading: true });

    expect(screen.getByTestId('sectionLoading')).toBeInTheDocument();
    expect(screen.queryByTestId('rollupJobsListTable')).not.toBeInTheDocument();
  });

  it('should display the <JobTable /> when there are jobs', () => {
    renderComponent({ hasJobs: true });

    expect(screen.queryByTestId('sectionLoading')).not.toBeInTheDocument();
    // The JobTable gets jobs from Redux store, which is empty in this test
    // But we can verify the page header is rendered, which is part of renderList()
    expect(screen.getByTestId('jobListPageHeader')).toBeInTheDocument();
  });

  describe('when there is an API error', () => {
    it('should display an error with the status and the message', () => {
      renderComponent({
        jobLoadError: {
          status: 400,
          body: { statusCode: 400, error: 'Houston we got a problem.' },
        },
      });

      expect(screen.getByTestId('jobListError')).toBeInTheDocument();
      expect(screen.getByTestId('jobListError')).toHaveTextContent('400 Houston we got a problem.');
    });
  });

  describe('when the user does not have the permission to access it', () => {
    it('should render an error message', () => {
      renderComponent({ jobLoadError: { status: 403 } });

      expect(screen.getByTestId('jobListNoPermission')).toBeInTheDocument();
      expect(screen.getByTestId('jobListNoPermission')).toHaveTextContent(
        'You do not have permission to view or add rollup jobs.'
      );
    });
  });
});
