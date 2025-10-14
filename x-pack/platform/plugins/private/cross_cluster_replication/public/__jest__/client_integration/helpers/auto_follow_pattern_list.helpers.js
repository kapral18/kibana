/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Router } from '@kbn/shared-ux-router';
import { createMemoryHistory } from 'history';
import { AutoFollowPatternList } from '../../../app/sections/home/auto_follow_pattern_list';
import { ccrStore } from '../../../app/store';
import { routing } from '../../../app/services/routing';

export const setup = (props = {}) => {
  const history = createMemoryHistory();
  routing.reactRouter = {
    history: {
      ...history,
      parentHistory: {
        createHref: () => '',
        push: () => {},
      },
    },
    getUrlForApp: () => '',
  };

  const renderResult = render(
    <Provider store={ccrStore}>
      <Router history={history}>
        <AutoFollowPatternList {...props} />
      </Router>
    </Provider>
  );

  const EUI_TABLE = 'autoFollowPatternListTable';

  /**
   * User Actions
   */

  const selectAutoFollowPatternAt = (index = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const checkbox = within(rows[index]).getByRole('checkbox');
    fireEvent.click(checkbox);
  };

  const getPatternsActionMenuItem = (index = 0) => {
    const button = screen.getByTestId('autoFollowPatternActionMenuButton');
    fireEvent.click(button);
    const contextMenu = screen.getByTestId('autoFollowPatternActionContextMenu');
    const buttons = within(contextMenu).getAllByRole('button');
    return buttons[index];
  };

  const clickPatternsActionMenuItem = (index = 0) => {
    const button = getPatternsActionMenuItem(index);
    fireEvent.click(button);
  };

  const getPatternsActionMenuItemText = (index = 0) => {
    const button = getPatternsActionMenuItem(index);
    return button.textContent || '';
  };

  const clickBulkDeleteButton = () => {
    clickPatternsActionMenuItem(1);
  };

  const clickConfirmModalDeleteAutoFollowPattern = () => {
    const modal = screen.getByTestId('deleteAutoFollowPatternConfirmation');
    const confirmButton = within(modal).getByTestId('confirmModalConfirmButton');
    fireEvent.click(confirmButton);
  };

  const clickRowActionButtonAt = (index = 0, action = 'delete') => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const cells = within(rows[index]).getAllByRole('cell');
    const lastCell = cells[cells.length - 1];

    let button;
    if (action === 'delete') {
      button = within(lastCell).getByTestId('deleteButton');
    } else if (action === 'edit') {
      button = within(lastCell).getByTestId('editButton');
    }

    if (!button) {
      throw new Error(`Button for action "${action}" not found.`);
    }

    fireEvent.click(button);
  };

  const clickAutoFollowPatternAt = (index = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const link = within(rows[index]).getByTestId('autoFollowPatternLink');
    fireEvent.click(link);
  };

  const clickPaginationNextButton = () => {
    const nextButton = screen.getByTestId('autoFollowPatternListTable.pagination-button-next');
    fireEvent.click(nextButton);
  };

  return {
    ...renderResult,
    find: (testSubject) => screen.getByTestId(testSubject),
    exists: (testSubject) => screen.queryByTestId(testSubject) !== null,
    table: {
      getMetaData: (testSubject) => {
        const table = screen.getByTestId(testSubject);
        const rows = within(table).getAllByRole('row').slice(1); // Skip header row
        const tableCellsValues = rows.map((row) => {
          return within(row).getAllByRole('cell').map((cell) => cell.textContent || '');
        });
        return { tableCellsValues };
      },
    },
    form: {
      setInputValue: (testSubject, value) => {
        const input = screen.getByTestId(testSubject);
        fireEvent.change(input, { target: { value } });
      },
    },
    actions: {
      selectAutoFollowPatternAt,
      clickBulkDeleteButton,
      clickConfirmModalDeleteAutoFollowPattern,
      clickRowActionButtonAt,
      clickAutoFollowPatternAt,
      getPatternsActionMenuItemText,
      clickPatternsActionMenuItem,
      clickPaginationNextButton,
    },
  };
};
