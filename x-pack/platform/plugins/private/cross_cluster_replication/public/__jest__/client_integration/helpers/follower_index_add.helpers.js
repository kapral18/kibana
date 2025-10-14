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
import { FollowerIndexAdd } from '../../../app/sections/follower_index_add';
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
        <FollowerIndexAdd {...props} />
      </Router>
    </Provider>
  );

  // User actions
  const clickSaveForm = () => {
    const submitButton = screen.getByTestId('submitButton');
    fireEvent.click(submitButton);
  };

  const toggleAdvancedSettings = () => {
    const toggle = screen.getByTestId('advancedSettingsToggle');
    fireEvent.click(toggle);
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
        const errors = screen.queryAllByText(/is required|are not allowed|can't begin|Remove the characters/i);
        return errors.map((error) => error.textContent);
      },
      toggleEuiSwitch: (testSubject) => {
        const toggle = screen.getByTestId(testSubject);
        fireEvent.click(toggle);
      },
    },
    actions: {
      clickSaveForm,
      toggleAdvancedSettings,
    },
  };
};
