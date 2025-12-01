/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';

import type { AppDependencies } from '../../../public/types';
import { setupEnvironment, kibanaVersion, getAppContextMock } from '../helpers';
import type { AppTestBed } from './app.helpers';
import { setupAppPage } from './app.helpers';

describe('Privileges', () => {
  let testBed: AppTestBed;
  let httpSetup: ReturnType<typeof setupEnvironment>['httpSetup'];
  beforeEach(async () => {
    const mockEnvironment = setupEnvironment();
    httpSetup = mockEnvironment.httpSetup;
  });

  describe('when user is not a Kibana global admin', () => {
    beforeEach(async () => {
      const appContextMock = getAppContextMock(kibanaVersion) as unknown as AppDependencies;
      const servicesMock = {
        ...appContextMock.services,
        core: {
          ...appContextMock.services.core,
          application: {
            capabilities: {
              spaces: {
                manage: false,
              },
            },
          },
        },
      };

      testBed = await setupAppPage(httpSetup, { services: servicesMock });
    });

    test('renders not authorized message', async () => {
      await screen.findByTestId('missingKibanaPrivilegesMessage');
      expect(screen.queryByTestId('overview')).not.toBeInTheDocument();
      expect(screen.getByTestId('missingKibanaPrivilegesMessage')).toBeInTheDocument();
    });
  });
});
