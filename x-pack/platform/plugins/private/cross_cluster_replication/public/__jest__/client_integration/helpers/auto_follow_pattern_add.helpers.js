/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from '@kbn/shared-ux-router';
import { createMemoryHistory } from 'history';
import { AutoFollowPatternAdd } from '../../../app/sections/auto_follow_pattern_add';
import { ccrStore } from '../../../app/store';
import { routing } from '../../../app/services/routing';

export const setup = (props = {}) => {
  const history = createMemoryHistory();
  routing.reactRouter = {
    history,
    route: {
      location: history.location,
      match: { path: '/', url: '/', isExact: true, params: {} },
    },
    getUrlForApp: () => '',
  };

  const renderResult = render(
    <Provider store={ccrStore}>
      <Router history={history}>
        <AutoFollowPatternAdd {...props} />
      </Router>
    </Provider>
  );

  // User actions
  const clickSaveForm = () => {
    const submitButton = screen.getByTestId('submitButton');
    fireEvent.click(submitButton);
  };

  return {
    ...renderResult,
    find: (testSubject) => screen.getByTestId(testSubject),
    exists: (testSubject) => screen.queryByTestId(testSubject) !== null,
    form: {
      setInputValue: (testSubject, value) => {
        const input = screen.getByTestId(testSubject);
        fireEvent.change(input, { target: { value } });
        fireEvent.blur(input);
      },
      getErrorsMessages: () => {
        const errors = screen.queryAllByText(/is required|are not allowed|can't begin|Remove the characters|Commas are not allowed/i);
        return errors.map((error) => error.textContent);
      },
    },
    actions: {
      clickSaveForm,
    },
  };
};
