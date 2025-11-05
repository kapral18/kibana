/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rollupJobsStore } from '../../../crud_app/store';
import { JobCreate } from '../../../crud_app/sections';
import { JOB_TO_CREATE } from './constants';
import { renderWithProviders } from './setup_context';

export const setup = (props) => {
  const RouterWrapper = ({ children }) => (
    <Provider store={rollupJobsStore}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  const { user, ...renderResult } = renderWithProviders(<JobCreate {...props} />, {
    wrapper: RouterWrapper,
  });

  // Helper functions
  const clickNextStep = async () => {
    const button = screen.getByTestId('rollupJobNextButton');
    await user.click(button);
  };

  const clickPreviousStep = async () => {
    const button = screen.getByTestId('rollupJobBackButton');
    await user.click(button);
  };

  const clickSave = async () => {
    const button = screen.getByTestId('rollupJobSaveButton');
    await user.click(button);
  };

  // Form helpers
  const setInputValue = async (testSubj, value) => {
    const input = screen.getByTestId(testSubj);
    await user.clear(input);
    await user.type(input, value.toString());
  };

  const getErrorsMessages = () => {
    const errors = screen.queryAllByTestId(/FormRow.*-error/);
    return errors.map((error) => error.textContent);
  };

  const selectCheckBox = async (testSubj) => {
    const checkbox = screen.getByTestId(testSubj);
    await user.click(checkbox);
  };

  // Forms
  const fillFormFields = async (step) => {
    switch (step) {
      case 'logistics':
        await setInputValue('rollupJobName', JOB_TO_CREATE.id);
        await setInputValue('rollupIndexPattern', JOB_TO_CREATE.indexPattern);
        await setInputValue('rollupIndexName', JOB_TO_CREATE.rollupIndex);
        break;
      case 'date-histogram':
        await setInputValue('rollupJobInterval', JOB_TO_CREATE.interval);
        break;
      default:
        return;
    }
  };

  // Navigation
  const goToStep = async (targetStep) => {
    const stepHandlers = {
      1: async () => await fillFormFields('logistics'),
      2: async () => await fillFormFields('date-histogram'),
    };

    let currentStep = 1;
    while (currentStep < targetStep) {
      if (stepHandlers[currentStep]) {
        await stepHandlers[currentStep]();
      }
      await clickNextStep();
      currentStep++;
    }
  };

  // Table helpers
  const getTableData = (testSubj) => {
    const table = screen.getByTestId(testSubj);
    const rows = within(table).getAllByRole('row');
    const dataRows = rows.slice(1); // Skip header
    
    return {
      tableCellsValues: dataRows.map((row) => {
        const cells = within(row).getAllByRole('cell');
        return cells.map((cell) => cell.textContent);
      }),
      rows: dataRows.map((row) => ({
        columns: within(row).getAllByRole('cell').map((cell) => ({
          value: cell.textContent,
          reactWrapper: cell,
        })),
        reactWrapper: row,
      })),
    };
  };

  // Misc
  const getEuiStepsHorizontalActive = () => {
    const selectedStep = document.querySelector('[class*="euiStepHorizontal"][class*="isSelected"]');
    return selectedStep ? selectedStep.textContent : '';
  };

  return {
    ...renderResult,
    user,
    goToStep,
    getEuiStepsHorizontalActive,
    actions: {
      clickNextStep,
      clickPreviousStep,
      clickSave,
    },
    form: {
      fillFormFields,
      setInputValue,
      getErrorsMessages,
      selectCheckBox,
    },
    table: {
      getMetaData: getTableData,
    },
  };
};
