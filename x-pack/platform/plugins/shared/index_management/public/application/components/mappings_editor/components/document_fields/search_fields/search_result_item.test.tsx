/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

import { StateProvider } from '../../../mappings_state_context';
import { SearchResultItem } from './search_result_item';
import type { SearchResult } from '../../../types';

describe('SearchResultItem', () => {
  const item = {
    field: {
      id: 'testField',
      nestedDepth: 2,
      path: ['foo', 'bar', 'baz'],
      source: {
        type: 'text',
        name: 'baz',
      },
      isMultiField: false,
    },
    display: <div>{'foo > bar > baz'}</div>,
  } as SearchResult;

  it('should display the field name and a badge to indicate its type', () => {
    renderWithI18n(
      <StateProvider>
        <SearchResultItem
          item={item}
          areActionButtonsVisible={false}
          isHighlighted={false}
          isDimmed={false}
        />
      </StateProvider>
    );

    expect(screen.getByTestId('fieldName')).toHaveTextContent('foo > bar > baz');
    expect(screen.getByTestId('fieldType')).toHaveTextContent('Text');
  });

  it('should show multi-field badge if the field is a multi-field', () => {
    const multiFieldItem = {
      ...item,
      field: {
        ...item.field,
        isMultiField: true,
      },
    };

    renderWithI18n(
      <StateProvider>
        <SearchResultItem
          item={multiFieldItem}
          areActionButtonsVisible={false}
          isHighlighted={false}
          isDimmed={false}
        />
      </StateProvider>
    );

    expect(screen.getByTestId('fieldType')).toHaveTextContent('Text multi-field');
  });

  it('should render action buttons if "areActionButtonsVisible" is true', () => {
    renderWithI18n(
      <StateProvider>
        <SearchResultItem
          item={item}
          areActionButtonsVisible={true}
          isHighlighted={false}
          isDimmed={false}
        />
      </StateProvider>
    );

    expect(screen.getByTestId('fieldActions')).toBeInTheDocument();
  });

  it('should fall back to source type if the field type is not found in the type definition', () => {
    const itemWithUnknownType = {
      ...item,
      field: {
        ...item.field,
        isMultiField: true,
        source: {
          ...item.field.source,
          type: 'unknown',
        },
      },
    };

    renderWithI18n(
      <StateProvider>
        <SearchResultItem
          item={itemWithUnknownType as SearchResult}
          areActionButtonsVisible={true}
          isHighlighted={false}
          isDimmed={false}
        />
      </StateProvider>
    );

    expect(screen.getByTestId('fieldType')).toHaveTextContent('unknown multi-field');
  });
});
