/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import { RequestTrialExtension } from '../public/application/sections/license_dashboard/request_trial_extension';
import { createMockLicense, getComponent } from './util';

describe('RequestTrialExtension component', () => {
  test('should not display when license is active and trial has not been used', () => {
    getComponent(
      {
        trialStatus: {
          canStartTrial: true,
        },
        license: createMockLicense('trial'),
      },
      RequestTrialExtension
    );
    expect(screen.queryByText(/Request an extension/i)).not.toBeInTheDocument();
  });
  test('should display when license is active and trial has been used', () => {
    const { container } = getComponent(
      {
        trialStatus: {
          canStartTrial: false,
        },
        license: createMockLicense('trial'),
      },
      RequestTrialExtension
    );
    expect(container).toMatchSnapshot();
  });
  test('should not display when license is not active and trial has not been used', () => {
    getComponent(
      {
        trialStatus: {
          canStartTrial: true,
        },
        license: createMockLicense('trial', 0),
      },
      RequestTrialExtension
    );
    expect(screen.queryByText(/Request an extension/i)).not.toBeInTheDocument();
  });
  test('should display when license is not active and trial has been used', () => {
    const { container } = getComponent(
      {
        trialStatus: {
          canStartTrial: false,
        },
        license: createMockLicense('trial', 0),
      },
      RequestTrialExtension
    );
    expect(container).toMatchSnapshot();
  });
  test('should display when platinum license is not active and trial has been used', () => {
    const { container } = getComponent(
      {
        trialStatus: {
          canStartTrial: false,
        },
        license: createMockLicense('platinum', 0),
      },
      RequestTrialExtension
    );
    expect(container).toMatchSnapshot();
  });
  test('should display when enterprise license is not active and trial has been used', () => {
    const { container } = getComponent(
      {
        trialStatus: {
          canStartTrial: false,
        },
        license: createMockLicense('enterprise', 0),
      },
      RequestTrialExtension
    );
    expect(container).toMatchSnapshot();
  });
  test('should not display when platinum license is active and trial has been used', () => {
    getComponent(
      {
        trialStatus: {
          canStartTrial: false,
        },
        license: createMockLicense('platinum'),
      },
      RequestTrialExtension
    );
    expect(screen.queryByText(/Request an extension/i)).not.toBeInTheDocument();
  });
});
