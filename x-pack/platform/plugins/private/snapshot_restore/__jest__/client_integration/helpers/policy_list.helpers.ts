/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { within, screen } from '@testing-library/react';
import type { HttpSetup } from '@kbn/core/public';
import { PolicyList } from '../../../public/application/sections/home/policy_list';
import { renderWithRouter } from './setup_environment';
import type { RenderWithProvidersResult } from './setup_environment';

const createActions = (renderResult: RenderWithProvidersResult) => {
  const { user, history } = renderResult;

  const clickPolicyAt = async (index: number) => {
    const table = screen.getByTestId('policyTable');
    const rows = within(table).getAllByRole('row');
    // Skip header row
    const dataRows = rows.slice(1);
    const policyLink = within(dataRows[index]).getByTestId('policyLink');
    
    await user.click(policyLink);
  };

  return {
    clickPolicyAt,
  };
};

export type PoliciesListTestBed = RenderWithProvidersResult & {
  actions: ReturnType<typeof createActions>;
};

export const setupPoliciesListPage = (httpSetup: HttpSetup): PoliciesListTestBed => {
  const renderResult = renderWithRouter(<PolicyList />, {
    initialEntries: ['/policies'],
    httpSetup,
  });

  return {
    ...renderResult,
    actions: createActions(renderResult),
  };
};
