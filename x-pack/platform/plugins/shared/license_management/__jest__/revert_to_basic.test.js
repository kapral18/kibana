/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import { RevertToBasic } from '../public/application/sections/license_dashboard/revert_to_basic';
import { createMockLicense, getComponent } from './util';

describe('RevertToBasic component', () => {
  test('should display when trial is active', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('trial'),
      },
      RevertToBasic
    );
    expect(container).toMatchSnapshot();
  });
  test('should display when license is expired', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('platinum', 0),
      },
      RevertToBasic
    );
    expect(container).toMatchSnapshot();
  });
  test('should display when license is about to expire', () => {
    // ten days from now
    const imminentExpirationTime = new Date().getTime() + 10 * 24 * 60 * 60 * 1000;
    const { container } = getComponent(
      {
        license: createMockLicense('platinum', imminentExpirationTime),
      },
      RevertToBasic
    );
    expect(container).toMatchSnapshot();
  });
  test('should not display for active basic license', () => {
    getComponent(
      {
        license: createMockLicense('basic'),
      },
      RevertToBasic
    );
    expect(screen.queryByText(/Revert to Basic/i)).not.toBeInTheDocument();
  });
  test('should not display for active gold license', () => {
    getComponent(
      {
        license: createMockLicense('gold'),
      },
      RevertToBasic
    );
    expect(screen.queryByText(/Revert to Basic/i)).not.toBeInTheDocument();
  });
  test('should not display for active platinum license', () => {
    getComponent(
      {
        license: createMockLicense('platinum'),
      },
      RevertToBasic
    );
    expect(screen.queryByText(/Revert to Basic/i)).not.toBeInTheDocument();
  });
});
