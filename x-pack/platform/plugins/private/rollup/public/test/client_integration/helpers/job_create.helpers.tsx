/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import * as userEventLib from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { rollupJobsStore } from '../../../crud_app/store';
import { JobCreate } from '../../../crud_app/sections';
import { JOB_TO_CREATE } from './constants';
import { WithAppDependencies } from './setup_context';

export interface JobCreateSetupResult extends RenderResult {
  user: UserEvent;
  actions: {
    clickNextStep: () => Promise<void>;
    clickPreviousStep: () => Promise<void>;
    clickSave: () => Promise<void>;
    fillFormFields: (step: string) => Promise<void>;
    goToStep: (targetStep: number) => Promise<void>;
  };
  getEuiStepsHorizontalActive: () => string;
  metrics: {
    getFieldListTableRows: () => HTMLElement[];
    getFieldListTableRow: (row: number) => HTMLElement;
    getFieldChooserColumnForRow: (row: number) => HTMLElement;
    getSelectAllInputForRow: (row: number) => HTMLInputElement | null;
  };
}

export const setup = (props?: any): JobCreateSetupResult => {
  const user = userEventLib.default.setup({
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0,
  });

  const JobCreateWithDependencies = WithAppDependencies(JobCreate);
  const renderResult = render(<JobCreateWithDependencies {...props} />, {
    wrapper: ({ children }) => <>{children}</>,
  });

  // Re-create the store context if needed
  const store = rollupJobsStore;

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

  const fillFormFields = async (step: string) => {
    switch (step) {
      case 'logistics':
        const nameInput = screen.getByTestId('rollupJobName');
        await user.clear(nameInput);
        await user.type(nameInput, JOB_TO_CREATE.id);

        const indexPatternInput = screen.getByTestId('rollupIndexPattern');
        await user.clear(indexPatternInput);
        await user.type(indexPatternInput, JOB_TO_CREATE.indexPattern);

        const rollupIndexInput = screen.getByTestId('rollupIndexName');
        await user.clear(rollupIndexInput);
        await user.type(rollupIndexInput, JOB_TO_CREATE.rollupIndex);
        break;

      case 'date-histogram':
        const intervalInput = screen.getByTestId('rollupJobInterval');
        await user.clear(intervalInput);
        await user.type(intervalInput, JOB_TO_CREATE.interval);
        break;

      default:
        return;
    }
  };

  const goToStep = async (targetStep: number) => {
    const stepHandlers: Record<number, () => Promise<void>> = {
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

  const getFieldListTableRows = () => {
    const table = screen.getByTestId('rollupJobMetricsFieldList');
    const rows = within(table).queryAllByRole('row');
    // Skip header row
    return rows.slice(1);
  };

  const getFieldListTableRow = (row: number) => {
    const rows = getFieldListTableRows();
    return rows[row];
  };

  const getFieldChooserColumnForRow = (row: number) => {
    const selectedRow = getFieldListTableRow(row);
    const cells = within(selectedRow).queryAllByRole('cell');
    return cells[2]; // Third column is field chooser
  };

  const getSelectAllInputForRow = (row: number): HTMLInputElement | null => {
    const fieldChooser = getFieldChooserColumnForRow(row);
    const input = within(fieldChooser).queryByRole('checkbox');
    return input as HTMLInputElement | null;
  };

  const getEuiStepsHorizontalActive = () => {
    const activeStep = renderResult.container.querySelector('[aria-current="step"]');
    return activeStep?.textContent || '';
  };

  return {
    ...renderResult,
    user,
    actions: {
      clickNextStep,
      clickPreviousStep,
      clickSave,
      fillFormFields,
      goToStep,
    },
    getEuiStepsHorizontalActive,
    metrics: {
      getFieldListTableRows,
      getFieldListTableRow,
      getFieldChooserColumnForRow,
      getSelectAllInputForRow,
    },
  };
};
