/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { i18n } from '@kbn/i18n';
import { I18nProvider } from '@kbn/i18n-react';
import { merge } from 'lodash';
import type { LocationDescriptorObject } from 'history';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import type { MemoryHistory } from 'history';

import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import type { HttpSetup } from '@kbn/core/public';
import { coreMock } from '@kbn/core/public/mocks';
import { setUiMetricService, httpService } from '../../../public/application/services/http';
import {
  breadcrumbService,
  docTitleService,
} from '../../../public/application/services/navigation';
import type { Authorization, Privileges } from '../../../public/shared_imports';
import { AuthorizationContext, GlobalFlyout } from '../../../public/shared_imports';
import { AppContextProvider } from '../../../public/application/app_context';
import { textService } from '../../../public/application/services/text';
import { init as initHttpRequests } from './http_requests';
import { UiMetricService } from '../../../public/application/services';

const { GlobalFlyoutProvider } = GlobalFlyout;

const createAuthorizationContextValue = (privileges: Privileges) => {
  return {
    isLoading: false,
    privileges: privileges ?? { hasAllPrivileges: false, missingPrivileges: {} },
  } as Authorization;
};

export const services = {
  uiMetricService: new UiMetricService('snapshot_restore'),
  httpService,
  i18n,
};

setUiMetricService(services.uiMetricService);

const core = coreMock.createStart();

const appDependencies = {
  core,
  services,
  config: {
    slm_ui: { enabled: true },
  },
  plugins: {},
};

const kibanaContextDependencies = {
  uiSettings: core.uiSettings,
  settings: core.settings,
  theme: core.theme,
};

export const setupEnvironment = () => {
  breadcrumbService.setup(() => undefined);
  textService.setup(i18n);
  docTitleService.setup(() => undefined);

  return initHttpRequests();
};

/**
 * Suppress error messages about Worker not being available in JS DOM.
 */
(window as any).Worker = function Worker() {
  this.postMessage = () => {};
  this.terminate = () => {};
};

export interface AppDependenciesOptions {
  httpSetup?: HttpSetup;
  privileges?: Privileges;
  overrides?: Record<string, unknown>;
}

export const WithAppDependencies =
  (Comp: any, httpSetup?: HttpSetup, { privileges, ...overrides }: Record<string, unknown> = {}) =>
  (props: any) => {
    // We need to optionally setup the httpService since some cit helpers (such as snapshot_list.helpers)
    // use jest mocks to stub the fetch hooks instead of mocking api responses.
    if (httpSetup) {
      httpService.setup(httpSetup);
    }

    return (
      <AuthorizationContext.Provider
        value={createAuthorizationContextValue(privileges as Privileges)}
      >
        <KibanaContextProvider services={kibanaContextDependencies}>
          <AppContextProvider value={merge(appDependencies, overrides) as any}>
            <GlobalFlyoutProvider>
              <Comp {...props} />
            </GlobalFlyoutProvider>
          </AppContextProvider>
        </KibanaContextProvider>
      </AuthorizationContext.Provider>
    );
  };

export interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent;
  history: MemoryHistory;
}

export interface RenderWithRouterOptions extends RenderOptions {
  initialEntries?: string[];
  initialIndex?: number;
  httpSetup?: HttpSetup;
  privileges?: Privileges;
  overrides?: Record<string, unknown>;
}

/**
 * Render helper with Router, I18n, and App dependencies.
 * Configures userEvent with proper timer and pointer event settings.
 */
export const renderWithRouter = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    initialIndex = 0,
    httpSetup,
    privileges,
    overrides = {},
    ...renderOptions
  }: RenderWithRouterOptions = {}
): RenderWithProvidersResult => {
  const history = createMemoryHistory({ initialEntries, initialIndex });
  
  // Setup httpService if provided
  if (httpSetup) {
    httpService.setup(httpSetup);
  }

  const user = userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>
      <Router history={history}>
        <AuthorizationContext.Provider
          value={createAuthorizationContextValue(privileges as Privileges)}
        >
          <KibanaContextProvider services={kibanaContextDependencies}>
            <AppContextProvider value={merge(appDependencies, overrides) as any}>
              <GlobalFlyoutProvider>{children}</GlobalFlyoutProvider>
            </AppContextProvider>
          </KibanaContextProvider>
        </AuthorizationContext.Provider>
      </Router>
    </I18nProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    user,
    history,
  };
};
