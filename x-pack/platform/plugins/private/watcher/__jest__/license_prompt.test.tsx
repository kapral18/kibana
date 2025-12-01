/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { sharePluginMock } from '@kbn/share-plugin/public/mocks';
import type {
  LicenseManagementLocator,
  LicenseManagementLocatorParams,
} from '@kbn/license-management-plugin/public/locator';
import { LicensePrompt } from '../public/application/license_prompt';

describe('License prompt', () => {
  test('renders a prompt with a link to License Management', () => {
    const locator = {
      ...sharePluginMock.createLocator(),
      useUrl: (params: LicenseManagementLocatorParams) => '/license_management',
    } as LicenseManagementLocator;
    
    render(
      <IntlProvider locale="en">
        <LicensePrompt message="License error" licenseManagementLocator={locator} />
      </IntlProvider>
    );

    expect(screen.getByRole('heading', { name: 'License error' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage your license' })).toHaveAttribute(
      'href',
      '/license_management'
    );
  });

  test('renders a prompt without a link to License Management', () => {
    render(
      <IntlProvider locale="en">
        <LicensePrompt message="License error" />
      </IntlProvider>
    );

    expect(screen.getByRole('heading', { name: 'License error' })).toBeInTheDocument();
    expect(screen.getByText('Contact your administrator to change your license.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage your license' })).not.toBeInTheDocument();
  });
});
