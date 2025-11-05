/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import { searchResponse } from './fixtures/search_response';
import type { Props } from '../profile_tree';
import { ProfileTree } from '../profile_tree';

describe('ProfileTree', () => {
  it('renders', () => {
    const props: Props = {
      onHighlight: () => {},
      target: 'searches',
      data: searchResponse,
      onDataInitError: jest.fn(),
    };
    const { container } = renderWithI18n(<ProfileTree {...props} />);
    expect(container).toBeInTheDocument();
  });

  it('does not throw despite bad profile data', () => {
    // For now, ignore the console.error that gets logged.
    const props: Props = {
      onHighlight: () => {},
      target: 'searches',
      onDataInitError: jest.fn(),
      data: [{}] as any,
    };

    const { container } = renderWithI18n(<ProfileTree {...props} />);
    expect(container).toBeInTheDocument();
    expect(props.onDataInitError).toHaveBeenCalled();
  });
});
