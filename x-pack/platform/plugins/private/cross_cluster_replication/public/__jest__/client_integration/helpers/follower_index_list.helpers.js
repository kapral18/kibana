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
import { FollowerIndicesList } from '../../../app/sections/home/follower_indices_list';
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
        <FollowerIndicesList {...props} />
      </Router>
    </Provider>
  );

  const EUI_TABLE = 'followerIndexListTable';

  /**
   * User Actions
   */

  const selectFollowerIndexAt = (index = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const checkbox = within(rows[index]).getByRole('checkbox');
    fireEvent.click(checkbox);
  };

  const openContextMenu = () => {
    const button = screen.getByTestId('contextMenuButton');
    fireEvent.click(button);
  };

  const clickContextMenuButtonAt = (index = 0) => {
    const contextMenu = screen.getByTestId('contextMenu');
    const buttons = within(contextMenu).getAllByRole('button');
    fireEvent.click(buttons[index]);
  };

  const openTableRowContextMenuAt = (index = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const buttons = within(rows[index]).getAllByRole('button');
    const actionButton = buttons[buttons.length - 1]; // Actions are in the last column
    if (!actionButton) {
      throw new Error(
        `No button to open context menu were found on Follower index list table row ${index}`
      );
    }
    fireEvent.click(actionButton);
  };

  const clickFollowerIndexAt = (index = 0) => {
    const table = screen.getByTestId(EUI_TABLE);
    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    const link = within(rows[index]).getByTestId('followerIndexLink');
    fireEvent.click(link);
  };

  const clickPaginationNextButton = () => {
    const nextButton = screen.getByTestId('followerIndexListTable.pagination-button-next');
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
    actions: {
      selectFollowerIndexAt,
      openContextMenu,
      clickContextMenuButtonAt,
      openTableRowContextMenuAt,
      clickFollowerIndexAt,
      clickPaginationNextButton,
    },
  };
};
