/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, render } from '@testing-library/react';

import { IndexCheckFlyout } from '.';
import {
  TestDataQualityProviders,
  TestExternalProviders,
} from '../../../mock/test_providers/test_providers';

describe('IndexCheckFlyout', () => {
  it('should render check flyout', () => {
    render(
      <TestExternalProviders>
        <TestDataQualityProviders>
          <IndexCheckFlyout
            ilmExplain={null}
            indexName="auditbeat-custom-index-1"
            pattern="auditbeat-*"
            patternRollup={undefined}
            stats={null}
            onClose={jest.fn()}
          />
        </TestDataQualityProviders>
      </TestExternalProviders>
    );

    expect(screen.getByTestId('indexCheckFlyout')).toBeInTheDocument();
  });
});
