/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { HttpSetup } from '@kbn/core/public';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { I18nProvider } from '@kbn/i18n-react';

import { SECURITY_MODEL } from '../../../common/constants';
import type { Cluster } from '../../../public';
import { RemoteClusterEdit } from '../../../public/application/sections';
import { createRemoteClustersStore } from '../../../public/application/store/store';
import { registerRouter } from '../../../public/application/services/routing';
import { createRemoteClustersActions, WithAppDependencies } from '../helpers';
import type { RemoteClustersActions } from '../helpers';

export const REMOTE_CLUSTER_EDIT_NAME = 'new-york';

export const REMOTE_CLUSTER_EDIT: Cluster = {
  name: REMOTE_CLUSTER_EDIT_NAME,
  seeds: ['localhost:9400'],
  skipUnavailable: true,
  securityModel: SECURITY_MODEL.CERTIFICATE,
};

export interface RemoteClusterEditTestBed extends RenderResult {
  actions: RemoteClustersActions;
}

export const setup = async (
  httpSetup: HttpSetup,
  overrides?: Record<string, unknown>
): Promise<RemoteClusterEditTestBed> => {
  const store = createRemoteClustersStore();
  const AppComponent = WithAppDependencies(RemoteClusterEdit, httpSetup, overrides);

  const user = userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  const ComponentWithProviders = () => {
    return (
      <I18nProvider>
        <MemoryRouter initialEntries={[`/${REMOTE_CLUSTER_EDIT_NAME}`]}>
          <Route
            path="/:name"
            render={(props) => {
              registerRouter(props.history as any);
              return (
                <Provider store={store}>
                  <AppComponent {...props} />
                </Provider>
              );
            }}
          />
        </MemoryRouter>
      </I18nProvider>
    );
  };

  const renderResult = render(<ComponentWithProviders />);

  return {
    ...renderResult,
    actions: createRemoteClustersActions(user),
  };
};
