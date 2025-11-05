/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { pageHelpers, mockHttpRequest } from './helpers';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setHttp, init as initDocumentation } from '../../crud_app/services';
import { coreMock, docLinksServiceMock } from '@kbn/core/public/mocks';

const { setup } = pageHelpers.jobCreate;

describe('Create Rollup Job, step 3: Terms', () => {
  let find;
  let exists;
  let actions;
  let getEuiStepsHorizontalActive;
  let goToStep;
  let table;
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
    user = testBed.user;
  });

  afterEach(() => {
    startMock.http.get.mockClear();
  });

  const numericFields = ['a-numericField', 'c-numericField'];
  const keywordFields = ['b-keywordField', 'd-keywordField'];

  const goToStepAndOpenFieldChooser = async () => {
    await goToStep(3);
    await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));
  };

  describe('layout', () => {
    beforeEach(async () => {
      await goToStep(3);
    });

    it('should have the horizontal step active on "Terms"', () => {
      expect(getEuiStepsHorizontalActive()).toContain('Terms');
    });

    it('should have the title set to "Terms"', () => {
      expect(exists('rollupJobCreateTermsTitle')).toBe(true);
    });

    it('should have a link to the documentation', () => {
      expect(exists('rollupJobCreateTermsDocsButton')).toBe(true);
    });

    test('should have a deprecation callout', () => {
      expect(exists('rollupDeprecationCallout')).toBe(true);
    });

    it('should have the "next" and "back" button visible', () => {
      expect(exists('rollupJobBackButton')).toBe(true);
      expect(exists('rollupJobNextButton')).toBe(true);
      expect(exists('rollupJobSaveButton')).toBe(false);
    });

    it('should go to the "Date histogram" step when clicking the back button', async () => {
      await actions.clickPreviousStep();
      expect(getEuiStepsHorizontalActive()).toContain('Date histogram');
    });

    it('should go to the "Histogram" step when clicking the next button', async () => {
      await actions.clickNextStep();
      expect(getEuiStepsHorizontalActive()).toContain('Histogram');
    });

    it('should have a button to display the list of terms to chose from', async () => {
      expect(exists('rollupJobTermsFieldChooser')).toBe(false);

      await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));

      expect(exists('rollupJobTermsFieldChooser')).toBe(true);
    });
  });

  describe('terms field chooser (flyout)', () => {
    describe('layout', () => {
      beforeEach(async () => {
        await goToStepAndOpenFieldChooser();
      });

      it('should have the title set to "Add terms fields"', async () => {
        expect(screen.getByTestId('rollupJobCreateFlyoutTitle').textContent).toEqual(
          'Add terms fields'
        );
      });

      it('should have a button to close the flyout', async () => {
        expect(exists('rollupJobTermsFieldChooser')).toBe(true);

        await user.click(screen.getByTestId('euiFlyoutCloseButton'));

        expect(exists('rollupJobTermsFieldChooser')).toBe(false);
      });
    });

    describe('when no terms are available', () => {
      it('should indicate it to the user', async () => {
        mockHttpRequest(startMock.http, {
          indxPatternVldtResp: {
            numericFields: [],
            keywordFields: [],
          },
        });
        await goToStepAndOpenFieldChooser();

        const { tableCellsValues } = table.getMetaData('rollupJobTermsFieldChooser-table');

        expect(tableCellsValues).toEqual([['No items found']]);
      });
    });

    describe('when terms are available', () => {
      beforeEach(async () => {
        mockHttpRequest(startMock.http, {
          indxPatternVldtResp: {
            numericFields,
            keywordFields,
          },
        });
        await goToStepAndOpenFieldChooser();
      });

      it('should display the numeric & keyword fields available', async () => {
        const { tableCellsValues } = table.getMetaData('rollupJobTermsFieldChooser-table');

        expect(tableCellsValues).toEqual([
          ['a-numericField', 'numeric'],
          ['b-keywordField', 'keyword'],
          ['c-numericField', 'numeric'],
          ['d-keywordField', 'keyword'],
        ]);
      });

      it('should add term to the field list when clicking on it', async () => {
        let { tableCellsValues } = table.getMetaData('rollupJobTermsFieldList');
        expect(tableCellsValues).toEqual([['No terms fields added']]);

        const tableElement = screen.getByTestId('rollupJobTermsFieldChooser-table');
        const rows = within(tableElement).getAllByRole('row').slice(1);
        await user.click(rows[0]);

        ({ tableCellsValues } = table.getMetaData('rollupJobTermsFieldList'));
        const [firstRow] = tableCellsValues;
        const [term, type] = firstRow;
        expect(term).toEqual('a-numericField');
        expect(type).toEqual('numeric');
      });
    });
  });

  describe('fields list', () => {
    it('should have an empty field list', async () => {
      await goToStep(3);

      const { tableCellsValues } = table.getMetaData('rollupJobTermsFieldList');
      expect(tableCellsValues).toEqual([['No terms fields added']]);
    });

    it('should have a delete button on each row to remove a term', async () => {
      mockHttpRequest(startMock.http, {
        indxPatternVldtResp: {
          numericFields,
          keywordFields,
        },
      });
      await goToStepAndOpenFieldChooser();
      
      const tableElement = screen.getByTestId('rollupJobTermsFieldChooser-table');
      const rows = within(tableElement).getAllByRole('row').slice(1);
      await user.click(rows[0]);

      let { tableCellsValues } = table.getMetaData('rollupJobTermsFieldList');
      expect(tableCellsValues[0][0]).not.toEqual('No terms fields added');

      const listTable = screen.getByTestId('rollupJobTermsFieldList');
      const listRows = within(listTable).getAllByRole('row').slice(1);
      const deleteButton = within(listRows[0]).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      ({ tableCellsValues } = table.getMetaData('rollupJobTermsFieldList'));
      expect(tableCellsValues[0][0]).toEqual('No terms fields added');
    });
  });
});
