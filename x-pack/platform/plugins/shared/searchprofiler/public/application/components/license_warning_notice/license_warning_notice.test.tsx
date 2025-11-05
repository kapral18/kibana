/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

import { LicenseWarningNotice } from './license_warning_notice';

describe('License Error Notice', () => {
  it('renders', () => {
    const { container } = renderWithI18n(<LicenseWarningNotice />);
    expect(container).toBeInTheDocument();
  });
});
