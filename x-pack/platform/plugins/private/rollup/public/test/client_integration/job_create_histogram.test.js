/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockHttpRequest, pageHelpers } from './helpers';
import { screen, within } from '@testing-library/react';
import { setHttp, init as initDocumentation } from '../../crud_app/services';
import { coreMock, docLinksServiceMock } from '@kbn/core/public/mocks';

const { setup } = pageHelpers.jobCreate;

describe('Create Rollup Job, step 4: Histogram', () => {
  let find;
  let exists;
  let actions;
  let getEuiStepsHorizontalActive;
  let goToStep;
  let table;
  let form;
  let user;
  let startMock;

  beforeAll(() => {
    jest.useFakeTimers();
    startMock = coreMock.createStart();
    setHttp(startMock.http);
    initDocumentation(docLinksServiceMock.createStartContract());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockHttpRequest(startMock.http);
    const testBed = setup();
    find = (testSubj) => screen.queryByTestId(testSubj);
    exists = (testSubj) => screen.queryByTestId(testSubj) !== null;
    actions = testBed.actions;
    getEuiStepsHorizontalActive = testBed.getEuiStepsHorizontalActive;
    goToStep = testBed.goToStep;
    table = testBed.table;
    form = testBed.form;
    user = testBed.user;
  });

  afterEach(() => {
    startMock.http.get.mockClear();
    startMock.http.post.mockClear();
    startMock.http.put.mockClear();
  });

  const numericFields = ['a-numericField', 'b-numericField'];

  const goToStepAndOpenFieldChooser = async () => {
    await goToStep(4);
    await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));
  };

  describe('layout', () => {
    beforeEach(async () => {
      await goToStep(4);
    });

    it('should have the horizontal step active on "Histogram"', () => {
      expect(getEuiStepsHorizontalActive()).toContain('Histogram');
    });

    it('should have the title set to "Terms"', () => {
      expect(exists('rollupJobCreateHistogramTitle')).toBe(true);
    });

    it('should have a link to the documentation', () => {
      expect(exists('rollupJobCreateHistogramDocsButton')).toBe(true);
    });

    test('should have a deprecation callout', () => {
      expect(exists('rollupDeprecationCallout')).toBe(true);
    });

    it('should have the "next" and "back" button visible', () => {
      expect(exists('rollupJobBackButton')).toBe(true);
      expect(exists('rollupJobNextButton')).toBe(true);
      expect(exists('rollupJobSaveButton')).toBe(false);
    });

    it('should go to the "Terms" step when clicking the back button', async () => {
      await actions.clickPreviousStep();
      expect(getEuiStepsHorizontalActive()).toContain('Terms');
    });

    it('should go to the "Metrics" step when clicking the next button', async () => {
      await actions.clickNextStep();
      expect(getEuiStepsHorizontalActive()).toContain('Metrics');
    });

    it('should have a button to display the list of histogram fields to chose from', async () => {
      expect(exists('rollupJobHistogramFieldChooser')).toBe(false);

      await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));

      expect(exists('rollupJobHistogramFieldChooser')).toBe(true);
    });
  });

  describe('histogram field chooser (flyout)', () => {
    describe('layout', () => {
      beforeEach(async () => {
        await goToStepAndOpenFieldChooser();
      });

      it('should have the title set to "Add histogram fields"', async () => {
        expect(screen.getByTestId('rollupJobCreateFlyoutTitle').textContent).toEqual(
          'Add histogram fields'
        );
      });

      it('should have a button to close the flyout', async () => {
        expect(exists('rollupJobHistogramFieldChooser')).toBe(true);

        await user.click(screen.getByTestId('euiFlyoutCloseButton'));

        expect(exists('rollupJobHistogramFieldChooser')).toBe(false);
      });
    });

    describe('when no histogram fields are availalbe', () => {
      it('should indicate it to the user', async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields: [] } });
        await goToStepAndOpenFieldChooser();

        const { tableCellsValues } = table.getMetaData('rollupJobHistogramFieldChooser-table');

        expect(tableCellsValues).toEqual([['No items found']]);
      });
    });

    describe('when histogram fields are available', () => {
      beforeEach(async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields } });
        await goToStepAndOpenFieldChooser();
      });

      it('should display the histogram fields available', async () => {
        const { tableCellsValues } = table.getMetaData('rollupJobHistogramFieldChooser-table');

        expect(tableCellsValues).toEqual([['a-numericField'], ['b-numericField']]);
      });

      it('should add histogram field to the field list when clicking on it', async () => {
        let { tableCellsValues } = table.getMetaData('rollupJobHistogramFieldList');
        expect(tableCellsValues).toEqual([['No histogram fields added']]);

        const tableElement = screen.getByTestId('rollupJobHistogramFieldChooser-table');
        const rows = within(tableElement).getAllByRole('row').slice(1);
        await user.click(rows[0]);

        ({ tableCellsValues } = table.getMetaData('rollupJobHistogramFieldList'));
        const [firstRow] = tableCellsValues;
        expect(firstRow[0]).toEqual('a-numericField');
      });
    });
  });

  describe('fields list', () => {
    it('should have an empty field list', async () => {
      await goToStep(4);

      const { tableCellsValues } = table.getMetaData('rollupJobHistogramFieldList');
      expect(tableCellsValues).toEqual([['No histogram fields added']]);
    });

    it('should have a delete button on each row to remove an histogram field', async () => {
      mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields } });
      await goToStepAndOpenFieldChooser();
      
      const tableElement = screen.getByTestId('rollupJobHistogramFieldChooser-table');
      const rows = within(tableElement).getAllByRole('row').slice(1);
      await user.click(rows[0]);

      let { tableCellsValues } = table.getMetaData('rollupJobHistogramFieldList');
      expect(tableCellsValues[0][0]).not.toEqual('No histogram fields added');

      const listTable = screen.getByTestId('rollupJobHistogramFieldList');
      const listRows = within(listTable).getAllByRole('row').slice(1);
      const deleteButton = within(listRows[0]).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      ({ tableCellsValues } = table.getMetaData('rollupJobHistogramFieldList'));
      expect(tableCellsValues[0][0]).toEqual('No histogram fields added');
    });
  });

  describe('interval', () => {
    const addHistogramFieldToList = async () => {
      await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));
      const tableElement = screen.getByTestId('rollupJobHistogramFieldChooser-table');
      const rows = within(tableElement).getAllByRole('row').slice(1);
      await user.click(rows[0]);
    };

    beforeEach(async () => {
      mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields } });
      await goToStep(4);
      await addHistogramFieldToList();
    });

    describe('input validation', () => {
      afterEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should display errors when clicking "next" without filling the interval', async () => {
        expect(exists('rollupJobCreateStepError')).toBeFalsy();

        await actions.clickNextStep();

        expect(exists('rollupJobCreateStepError')).toBeTruthy();
        expect(form.getErrorsMessages()).toEqual(['Interval must be a whole number.']);
      });

      it('should be a whole number', async () => {
        await form.setInputValue('rollupJobCreateHistogramInterval', '5.5');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toEqual(['Interval must be a whole number.']);
      });

      it('should be greater than zero', async () => {
        await form.setInputValue('rollupJobCreateHistogramInterval', '-1');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toEqual(['Interval must be greater than zero.']);
      });
    });

    it('should go to next "Metrics" step if value is valid', async () => {
      await form.setInputValue('rollupJobCreateHistogramInterval', '3');
      await actions.clickNextStep();
      expect(getEuiStepsHorizontalActive()).toContain('Metrics');
    });
  });
});
