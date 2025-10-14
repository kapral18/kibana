/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from '@kbn/shared-ux-router';
import { createMemoryHistory } from 'history';
import { CrossClusterReplicationHome } from '../../../app/sections/home/home';
import { ccrStore } from '../../../app/store';
import { routing } from '../../../app/services/routing';

export const setup = (props = {}) => {
  const history = createMemoryHistory({ initialEntries: ['/follower_indices'] });
  routing.reactRouter = {
    history,
    route: {
      location: history.location,
      match: { path: '/:section', url: '/follower_indices', isExact: true, params: { section: 'follower_indices' } },
    },
  };

  const renderResult = render(
    <Provider store={ccrStore}>
      <Router history={history}>
        <Switch>
          <Route path="/:section" component={CrossClusterReplicationHome} />
        </Switch>
      </Router>
    </Provider>
  );

  return {
    ...renderResult,
    find: (testSubject) => screen.getByTestId(testSubject),
    exists: (testSubject) => screen.queryByTestId(testSubject) !== null,
  };
};
