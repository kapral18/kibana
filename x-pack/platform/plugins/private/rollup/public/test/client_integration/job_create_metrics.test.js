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

describe('Create Rollup Job, step 5: Metrics', () => {
  let find;
  let exists;
  let actions;
  let getEuiStepsHorizontalActive;
  let goToStep;
  let table;
  let user;
  let form;
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
    form = testBed.form;
  });

  afterEach(() => {
    startMock.http.get.mockClear();
    startMock.http.post.mockClear();
    startMock.http.put.mockClear();
  });

  const numericFields = ['a-numericField', 'c-numericField'];
  const dateFields = ['b-dateField', 'd-dateField'];

  const goToStepAndOpenFieldChooser = async () => {
    await goToStep(5);
    await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));
  };

  describe('layout', () => {
    beforeEach(async () => {
      await goToStep(5);
    });

    it('should have the horizontal step active on "Metrics"', () => {
      expect(getEuiStepsHorizontalActive()).toContain('Metrics');
    });

    it('should have the title set to "Metrics"', () => {
      expect(exists('rollupJobCreateMetricsTitle')).toBe(true);
    });

    it('should have a link to the documentation', () => {
      expect(exists('rollupJobCreateMetricsDocsButton')).toBe(true);
    });

    test('should have a deprecation callout', () => {
      expect(exists('rollupDeprecationCallout')).toBe(true);
    });

    it('should have the "next" and "back" button visible', () => {
      expect(exists('rollupJobBackButton')).toBe(true);
      expect(exists('rollupJobNextButton')).toBe(true);
      expect(exists('rollupJobSaveButton')).toBe(false);
    });

    it('should go to the "Histogram" step when clicking the back button', async () => {
      await actions.clickPreviousStep();
      expect(getEuiStepsHorizontalActive()).toContain('Histogram');
    });

    it('should go to the "Review" step when clicking the next button', async () => {
      await actions.clickNextStep();
      expect(getEuiStepsHorizontalActive()).toContain('Review');
    });

    it('should have a button to display the list of metrics fields to chose from', async () => {
      expect(exists('rollupJobMetricsFieldChooser')).toBe(false);

      await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));

      expect(exists('rollupJobMetricsFieldChooser')).toBe(true);
    });
  });

  describe('metrics field chooser (flyout)', () => {
    describe('layout', () => {
      beforeEach(async () => {
        await goToStepAndOpenFieldChooser();
      });

      it('should have the title set to "Add metrics fields"', async () => {
        expect(screen.getByTestId('rollupJobCreateFlyoutTitle').textContent).toEqual(
          'Add metrics fields'
        );
      });

      it('should have a button to close the flyout', async () => {
        expect(exists('rollupJobMetricsFieldChooser')).toBe(true);

        await user.click(screen.getByTestId('euiFlyoutCloseButton'));

        expect(exists('rollupJobMetricsFieldChooser')).toBe(false);
      });
    });

    describe('table', () => {
      beforeEach(async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields, dateFields } });
        await goToStepAndOpenFieldChooser();
      });

      it('should display the fields with metrics and its type', async () => {
        const { tableCellsValues } = table.getMetaData('rollupJobMetricsFieldChooser-table');

        expect(tableCellsValues).toEqual([
          ['a-numericField', 'numeric'],
          ['b-dateField', 'date'],
          ['c-numericField', 'numeric'],
          ['d-dateField', 'date'],
        ]);
      });

      it('should add metric field to the field list when clicking on a row', async () => {
        let { tableCellsValues } = table.getMetaData('rollupJobMetricsFieldList');
        expect(tableCellsValues).toEqual([['No metrics fields added']]);

        const tableElement = screen.getByTestId('rollupJobMetricsFieldChooser-table');
        const rows = within(tableElement).getAllByRole('row').slice(1);
        await user.click(rows[0]);

        ({ tableCellsValues } = table.getMetaData('rollupJobMetricsFieldList'));
        const [firstRow] = tableCellsValues;
        const [field, type] = firstRow;
        expect(field).toContain('a-numericField');
        expect(type).toContain('numeric');
      });
    });
  });

  describe('fields list', () => {
    const addFieldToList = async (type = 'numeric') => {
      if (!exists('rollupJobMetricsFieldChooser-table')) {
        await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));
      }
      
      const tableElement = screen.getByTestId('rollupJobMetricsFieldChooser-table');
      const rows = within(tableElement).getAllByRole('row').slice(1);
      
      for (let i = 0; i < rows.length; i++) {
        const cells = within(rows[i]).getAllByRole('cell');
        if (cells[1].textContent === type) {
          await user.click(rows[i]);
          break;
        }
      }
    };

    const numericTypeMetrics = ['avg', 'max', 'min', 'sum', 'value_count'];
    const dateTypeMetrics = ['max', 'min', 'value_count'];

    it('should have an empty field list', async () => {
      await goToStep(5);

      const { tableCellsValues } = table.getMetaData('rollupJobMetricsFieldList');
      expect(tableCellsValues).toEqual([['No metrics fields added']]);
    });

    describe('when fields are added', () => {
      beforeEach(async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields, dateFields } });
        await goToStepAndOpenFieldChooser();
      });

      it('should have "avg", "max", "min", "sum" & "value count" metrics for *numeric* fields', async () => {
        await addFieldToList('numeric');
        numericTypeMetrics.forEach((type) => {
          try {
            expect(exists(`rollupJobMetricsCheckbox-${type}`)).toBe(true);
          } catch (e) {
            throw new Error(`Test subject "rollupJobMetricsCheckbox-${type}" was not found.`);
          }
        });

        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const firstRow = within(metricsTable).getAllByRole('row').slice(1)[0];
        const metricsCheckboxes = within(firstRow).getAllByRole('checkbox');
        expect(metricsCheckboxes.length).toBe(numericTypeMetrics.length + 1);
      });

      it('should have "max", "min", & "value count" metrics for *date* fields', async () => {
        await addFieldToList('date');

        dateTypeMetrics.forEach((type) => {
          try {
            expect(exists(`rollupJobMetricsCheckbox-${type}`)).toBe(true);
          } catch (e) {
            throw new Error(`Test subject "rollupJobMetricsCheckbox-${type}" was not found.`);
          }
        });

        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const firstRow = within(metricsTable).getAllByRole('row').slice(1)[0];
        const metricsCheckboxes = within(firstRow).getAllByRole('checkbox');
        expect(metricsCheckboxes.length).toBe(dateTypeMetrics.length + 1);
      });

      it('should not allow to go to the next step if at least one metric type is not selected', async () => {
        expect(exists('rollupJobCreateStepError')).toBeFalsy();

        await addFieldToList('numeric');
        await actions.clickNextStep();

        const stepError = find('rollupJobCreateStepError');
        expect(stepError).not.toBeNull();
        expect(stepError.textContent).toContain('a-numericField');
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should have a delete button on each row to remove the metric field', async () => {
        const tableElement = screen.getByTestId('rollupJobMetricsFieldChooser-table');
        const rows = within(tableElement).getAllByRole('row').slice(1);
        await user.click(rows[0]);

        let metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        let metricsRows = within(metricsTable).getAllByRole('row').slice(1);
        expect(metricsRows[0]).toBeInTheDocument();

        const deleteButton = within(metricsRows[0]).getByRole('button', { name: /delete/i });
        await user.click(deleteButton);

        metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        metricsRows = within(metricsTable).getAllByRole('row').slice(1);
        const { tableCellsValues } = table.getMetaData('rollupJobMetricsFieldList');
        expect(tableCellsValues[0][0]).toEqual('No metrics fields added');
      });
    });

    describe('when using multi-selectors', () => {
      beforeEach(async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields, dateFields } });
        await goToStep(5);
        await addFieldToList('numeric');
        await addFieldToList('date');
        await user.click(screen.getByTestId('rollupJobSelectAllMetricsPopoverButton'));
      });

      const expectAllFieldChooserInputs = (row, expected) => {
        const checkboxes = within(row).getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          expect(checkbox.checked).toBe(expected);
        });
      };

      it('should select all of the fields in a row', async () => {
        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const rows = within(metricsTable).getAllByRole('row').slice(1);
        const firstRow = rows[0];
        
        const selectAllCheckbox = within(firstRow).getAllByRole('checkbox')[0];
        await user.click(selectAllCheckbox);
        
        expectAllFieldChooserInputs(firstRow, true);
      });

      it('should deselect all of the fields in a row ', async () => {
        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const rows = within(metricsTable).getAllByRole('row').slice(1);
        const firstRow = rows[0];
        
        const selectAllCheckbox = within(firstRow).getAllByRole('checkbox')[0];
        await user.click(selectAllCheckbox);
        expectAllFieldChooserInputs(firstRow, true);

        await user.click(selectAllCheckbox);
        expectAllFieldChooserInputs(firstRow, false);
      });

      it('should select all of the metric types across rows (column-wise)', async () => {
        const selectAllAvgCheckbox = screen.getByTestId('rollupJobMetricsSelectAllCheckbox-avg');
        await user.click(selectAllAvgCheckbox);

        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const rows = within(metricsTable).getAllByRole('row').slice(1);

        rows.forEach((row) => {
          const cells = within(row).getAllByRole('cell');
          if (cells[1].textContent === 'numeric') {
            const avgCheckbox = within(row).getByTestId('rollupJobMetricsCheckbox-avg');
            expect(avgCheckbox.checked).toBe(true);
          }
        });
      });

      it('should deselect all of the metric types across rows (column-wise)', async () => {
        const selectAllAvgCheckbox = screen.getByTestId('rollupJobMetricsSelectAllCheckbox-avg');

        await user.click(selectAllAvgCheckbox);
        await user.click(selectAllAvgCheckbox);

        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const rows = within(metricsTable).getAllByRole('row').slice(1);

        rows.forEach((row) => {
          const cells = within(row).getAllByRole('cell');
          if (cells[1].textContent === 'numeric') {
            const checkboxes = within(row).getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
              expect(checkbox.checked).toBe(false);
            });
          }
        });
      });

      it('should correctly select across rows and columns', async () => {
        const selectAllAvg = screen.getByTestId('rollupJobMetricsSelectAllCheckbox-avg');
        await user.click(selectAllAvg);
        
        const selectAllMax = screen.getByTestId('rollupJobMetricsSelectAllCheckbox-max');
        await user.click(selectAllMax);

        const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
        const rows = within(metricsTable).getAllByRole('row').slice(1);
        const firstRow = rows[0];

        const selectAllCheckbox = within(firstRow).getAllByRole('checkbox')[0];
        await user.click(selectAllCheckbox);
        await user.click(selectAllCheckbox);

        expect(selectAllAvg.checked).toBe(false);
        expect(selectAllMax.checked).toBe(false);

        const lastRow = rows[rows.length - 1];
        const lastRowSelectAll = within(lastRow).getAllByRole('checkbox')[0];
        await user.click(lastRowSelectAll);

        await user.click(selectAllMax);
        await user.click(selectAllMax);

        const checkboxes = within(lastRow).getAllByRole('checkbox');
        checkboxes.forEach((checkbox) => {
          const testSubj = checkbox.getAttribute('data-test-subj');
          if (testSubj?.includes('max') || testSubj?.includes('All')) {
            expect(checkbox.checked).toBe(false);
          } else if (testSubj?.includes('rollupJobMetricsCheckbox')) {
            expect(checkbox.checked).toBe(true);
          }
        });
      });
    });
  });
});
