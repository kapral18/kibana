/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { MemoryRouter, Routes, Route } from '@kbn/shared-ux-router';
import type { Store } from 'redux';
import type { RouterHistory, Match, Location } from '@kbn/shared-ux-router';

interface RenderWithRouterOptions {
  store?: Store;
  onRouter?: (router: { history: RouterHistory; route: { match: Match; location: Location } }) => void;
  initialEntries?: string[];
  routePath?: string;
  defaultProps?: Record<string, unknown>;
}

interface ComponentProps {
  match?: Match;
  history?: RouterHistory;
  location?: Location;
}

/**
 * Render helper for Remote Clusters components with Redux store and React Router setup.
 * Returns a user event instance configured for fake timers.
 *
 * @example
 * const { user } = renderWithRouter(MyComponent, {
 *   store: remoteClustersStore,
 *   initialEntries: ['/add'],
 *   routePath: '/add',
 * });
 */
export const renderWithRouter = (
  Component: React.ComponentType<ComponentProps>,
  { store, onRouter, initialEntries = ['/'], routePath = '/', defaultProps = {} }: RenderWithRouterOptions = {}
) => {
  const user = userEventLib.default.setup({
    // eslint-disable-next-line no-undef
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0, // Skip pointer-events check for EUI popovers/portals
  });

  const Wrapped = (routeProps: { match: Match; history: RouterHistory; location: Location }) => {
    // Setup routing callback if provided
    if (typeof onRouter === 'function') {
      const router = {
        history: routeProps.history,
        route: { match: routeProps.match, location: routeProps.location },
      };
      onRouter(router);
    }

    const ComponentWithProps = (
      <Component
        {...defaultProps}
        match={routeProps.match}
        history={routeProps.history}
        location={routeProps.location}
      />
    ) as ReactElement;

    return (
      <IntlProvider locale="en">
        {store ? <Provider store={store}>{ComponentWithProps}</Provider> : ComponentWithProps}
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
    store,
    ...renderResult,
  };
};
