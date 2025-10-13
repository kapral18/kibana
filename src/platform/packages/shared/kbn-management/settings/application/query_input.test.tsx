/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { Query } from '@elastic/eui';
import { act, waitFor, screen, fireEvent } from '@testing-library/react';

import { renderWithI18n } from '@kbn/test-jest-helpers';
import { getSettingsMock } from '@kbn/management-settings-utilities/mocks/settings.mock';

import { QueryInput } from './query_input';
import { getFieldDefinitions } from '@kbn/management-settings-field-definition';
import { categorizeFields } from '@kbn/management-settings-utilities';

const query = Query.parse('');
const settings = getSettingsMock();
const categories = Object.keys(
  categorizeFields(
    getFieldDefinitions(settings, { isCustom: () => false, isOverridden: () => false })
  )
);

describe('Search', () => {
  it('should render normally', async () => {
    const onQueryChange = () => {};
    renderWithI18n(<QueryInput {...{ categories, query, onQueryChange }} />);

    expect(screen.getByTestId('settingsSearchBar')).toBeInTheDocument();
  });

  it('should call parent function when query is changed', async () => {
    // This test is brittle as it knows about implementation details
    // (EuiFieldSearch uses onKeyup instead of onChange to handle input)
    const onQueryChange = jest.fn();
    renderWithI18n(<QueryInput {...{ categories, query, onQueryChange }} />);
    
    const searchBar = screen.getByTestId('settingsSearchBar');
    fireEvent.keyUp(searchBar, { target: { value: 'new filter' } });
    
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it('should handle query parse error', async () => {
    const onQueryChange = jest.fn();
    renderWithI18n(<QueryInput {...{ categories, query }} onQueryChange={onQueryChange} />);

    const searchBar = screen.getByTestId('settingsSearchBar');

    // Send invalid query
    act(() => {
      fireEvent.keyUp(searchBar, { target: { value: '?' } });
    });

    expect(onQueryChange).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Unable to parse query')).toBeInTheDocument();
    });

    // Send valid query to ensure component can recover from invalid query
    act(() => {
      fireEvent.keyUp(searchBar, { target: { value: 'dateFormat' } });
    });

    expect(onQueryChange).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(screen.queryByText('Unable to parse query')).not.toBeInTheDocument();
    });
  });
});
