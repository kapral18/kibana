/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { HttpSetup } from '@kbn/core/public';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { MemoryRouter, Routes, Route } from '@kbn/shared-ux-router';

import { mockContextValue } from './app_context.mock';
import { AppContextProvider } from '../../../public/application/app_context';
import { setHttpClient } from '../../../public/application/lib/api';
import { registerRouter } from '../../../public/application/lib/navigation';

export interface RenderOptions {
  initialEntries?: string[];
  routePath?: string;
  httpSetup: HttpSetup;
  onRouter?: (router: any) => void;
}

export interface RenderWithRouterResult extends RenderResult {
  user: UserEvent;
}

/**
 * Helper to render components with all required context providers
 */
export const renderWithRouter = (
  Component: React.ComponentType<any>,
  { httpSetup, initialEntries = ['/'], routePath = '/', onRouter }: RenderOptions
): RenderWithRouterResult => {
  const user = userEventLib.default.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  setHttpClient(httpSetup);

  const Wrapped = (routeProps: any) => {
    if (typeof onRouter === 'function') {
      const router = {
        history: routeProps.history,
        route: { match: routeProps.match, location: routeProps.location },
      };
      onRouter(router);
      registerRouter(router);
    }

    return (
      <IntlProvider locale="en">
        <KibanaContextProvider services={{ uiSettings: mockContextValue.uiSettings }}>
          <AppContextProvider value={mockContextValue}>
            <Component
              {...routeProps}
              match={routeProps.match}
              history={routeProps.history}
              location={routeProps.location}
            />
          </AppContextProvider>
        </KibanaContextProvider>
      </IntlProvider>
    );
  };

  const renderResult = render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={routePath} component={Wrapped} />
      </Routes>
    </MemoryRouter>
  );

  return {
    user,
    ...renderResult,
  };
};

/**
 * Helper to find elements by test subject using data-test-subj attribute
 */
export const findTestSubject = (
  container: HTMLElement | RenderResult,
  testSubj: string,
  matcher: 'exact' | 'substring' = 'exact'
) => {
  const element = 'container' in container ? container.container : container;
  
  if (matcher === 'exact') {
    return within(element).queryByTestId(testSubj);
  }
  
  // For substring matching
  return within(element).queryByTestId(new RegExp(testSubj));
};

/**
 * Helper to get all elements by test subject
 */
export const findAllTestSubjects = (
  container: HTMLElement | RenderResult,
  testSubj: string
) => {
  const element = 'container' in container ? container.container : container;
  return within(element).queryAllByTestId(testSubj);
};
