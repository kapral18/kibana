/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../../test/client_integration/helpers/setup_context';
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

const defaultProps = {
  history: { location: {} },
  loadJobs: () => {},
  refreshJobs: () => {},
  openDetailPanel: () => {},
  hasJobs: false,
  isLoading: false,
};

const services = {
  setBreadcrumbs: startMock.chrome.setBreadcrumbs,
};

const renderJobList = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  
  const Wrapper = ({ children }) => (
    <KibanaContextProvider services={services}>
      <Provider store={rollupJobsStore}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </Provider>
    </KibanaContextProvider>
  );

  return renderWithProviders(<JobList {...mergedProps} />, { wrapper: Wrapper });
};

describe('<JobList />', () => {
  it('should render deprecated prompt when loading is complete and there are no rollup jobs', () => {
    renderJobList();
    expect(screen.getByTestId('jobListDeprecatedPrompt')).toBeInTheDocument();
  });

  it('should display a loading message when loading the jobs', () => {
    renderJobList({ isLoading: true });
    
    expect(screen.getByTestId('sectionLoading')).toBeInTheDocument();
    expect(screen.queryByTestId('rollupJobsListTable')).not.toBeInTheDocument();
  });

  it('should display the <JobTable /> when there are jobs', () => {
    renderJobList({ hasJobs: true });
    
    expect(screen.queryByTestId('sectionLoading')).not.toBeInTheDocument();
    expect(screen.getByTestId('rollupJobsListTable')).toBeInTheDocument();
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
      expect(screen.getByText(/400 Houston we got a problem./)).toBeInTheDocument();
    });
  });

  describe('when the user does not have the permission to access it', () => {
    it('should render an error message', () => {
      renderJobList({ jobLoadError: { status: 403 } });

      expect(screen.getByTestId('jobListNoPermission')).toBeInTheDocument();
      expect(
        screen.getByText('You do not have permission to view or add rollup jobs.')
      ).toBeInTheDocument();
    });
  });
});
