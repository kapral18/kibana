/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import { StartTrial } from '../public/application/sections/license_dashboard/start_trial';
import { createMockLicense, getComponent } from './util';

describe('StartTrial component when trial is allowed', () => {
  test('display for basic license', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('basic'),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(container).toMatchSnapshot();
  });
  test('should display for gold license', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(container).toMatchSnapshot();
  });

  test('should not display for trial license', () => {
    getComponent(
      {
        license: createMockLicense('trial'),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should not display for active platinum license', () => {
    getComponent(
      {
        license: createMockLicense('platinum'),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should display for expired platinum license', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('platinum', 0),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(container).toMatchSnapshot();
  });
  test('should not display for active enterprise license', () => {
    getComponent(
      {
        license: createMockLicense('enterprise'),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should display for expired enterprise license', () => {
    const { container } = getComponent(
      {
        license: createMockLicense('enterprise', 0),
        trialStatus: { canStartTrial: true },
      },
      StartTrial
    );
    expect(container).toMatchSnapshot();
  });
});

describe('StartTrial component when trial is not available', () => {
  test('should not display for basic license', () => {
    getComponent(
      {
        license: createMockLicense('basic'),
        trialStatus: { canStartTrial: false },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should not display for gold license', () => {
    getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: false },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should not display for platinum license', () => {
    getComponent(
      {
        license: createMockLicense('platinum'),
        trialStatus: { canStartTrial: false },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
  test('should not display for enterprise license', () => {
    getComponent(
      {
        license: createMockLicense('enterprise'),
        trialStatus: { canStartTrial: false },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });

  test('should not display for trial license', () => {
    getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: false },
      },
      StartTrial
    );
    expect(screen.queryByText(/Start a 30-day trial/i)).not.toBeInTheDocument();
  });
});
