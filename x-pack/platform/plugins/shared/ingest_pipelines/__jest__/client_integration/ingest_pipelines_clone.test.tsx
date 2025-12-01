/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { Router, Route, Routes } from '@kbn/shared-ux-router';
import { I18nProvider } from '@kbn/i18n-react';

import { setupEnvironment } from './helpers';
import { API_BASE_PATH } from '../../common/constants';
import { PIPELINE_TO_CLONE } from './helpers/pipelines_clone.helpers';
import { getClonePath, ROUTES } from '../../public/application/services/navigation';
import { PipelinesClone } from '../../public/application/sections/pipelines_clone';
import { WithAppDependencies } from './helpers/setup_environment';

const originalLocation = window.location;

describe('<PipelinesClone />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeEach(() => {
    httpRequestsMockHelpers.setLoadPipelineResponse(PIPELINE_TO_CLONE.name, PIPELINE_TO_CLONE);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: getClonePath({ clonedPipelineName: PIPELINE_TO_CLONE.name }),
      },
    });

    const Component = WithAppDependencies(PipelinesClone, httpSetup);
    const history = createMemoryHistory({
      initialEntries: [getClonePath({ clonedPipelineName: PIPELINE_TO_CLONE.name })],
    });
    
    render(
      <I18nProvider>
        <Router history={history}>
          <Routes>
            <Route path={ROUTES.clone} component={Component} />
          </Routes>
        </Router>
      </I18nProvider>
    );
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  test('should render the correct page header', async () => {
    // Verify page title
    expect(await screen.findByTestId('pageTitle')).toBeInTheDocument();
    expect(screen.getByTestId('pageTitle')).toHaveTextContent('Create pipeline');

    // Verify documentation link
    expect(screen.getByTestId('documentationLink')).toBeInTheDocument();
    expect(screen.getByTestId('documentationLink')).toHaveTextContent('Create pipeline docs');
  });

  describe('form submission', () => {
    it('should send the correct payload', async () => {
      const submitButton = await screen.findByTestId('submitButton');
      await userEvent.click(submitButton);

      expect(httpSetup.post).toHaveBeenLastCalledWith(
        API_BASE_PATH,
        expect.objectContaining({
          body: JSON.stringify({
            ...PIPELINE_TO_CLONE,
            name: `${PIPELINE_TO_CLONE.name}-copy`,
          }),
        })
      );
    });
  });
});
