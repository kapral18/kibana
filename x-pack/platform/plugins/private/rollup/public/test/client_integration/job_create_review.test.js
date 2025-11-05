/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { pageHelpers, mockHttpRequest } from './helpers';
import { screen, within, waitFor } from '@testing-library/react';
import { first } from 'lodash';
import { coreMock } from '@kbn/core/public/mocks';
import { setHttp } from '../../crud_app/services';
import { JOBS } from './helpers/constants';

jest.mock('../../kibana_services', () => {
  const services = jest.requireActual('../../kibana_services');
  return {
    ...services,
    getUiStatsReporter: jest.fn(() => () => {}),
  };
});

const { setup } = pageHelpers.jobCreate;

describe('Create Rollup Job, step 6: Review', () => {
  let find;
  let exists;
  let actions;
  let getEuiStepsHorizontalActive;
  let goToStep;
  let table;
  let form;
  let startMock;
  let user;

  beforeAll(() => {
    jest.useFakeTimers();
    startMock = coreMock.createStart();
    setHttp(startMock.http);
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

  describe('layout', () => {
    beforeEach(async () => {
      await goToStep(6);
    });

    it('should have the horizontal step active on "Review"', () => {
      expect(getEuiStepsHorizontalActive()).toContain('Review');
    });

    it('should have the title set to "Review"', () => {
      expect(exists('rollupJobCreateReviewTitle')).toBe(true);
    });

    test('should have a deprecation callout', () => {
      expect(exists('rollupDeprecationCallout')).toBe(true);
    });

    it('should have the "next" and "save" button visible', () => {
      expect(exists('rollupJobBackButton')).toBe(true);
      expect(exists('rollupJobNextButton')).toBe(false);
      expect(exists('rollupJobSaveButton')).toBe(true);
    });

    it('should go to the "Metrics" step when clicking the back button', async () => {
      await actions.clickPreviousStep();
      expect(getEuiStepsHorizontalActive()).toContain('Metrics');
    });
  });

  describe('tabs', () => {
    const getTabsText = () => {
      const tabs = screen.getAllByTestId('stepReviewTab');
      return tabs.map((tab) => tab.textContent);
    };
    
    const selectFirstField = async (step) => {
      await user.click(screen.getByTestId('rollupJobShowFieldChooserButton'));

      const tableElement = screen.getByTestId(`rollupJob${step}FieldChooser-table`);
      const rows = within(tableElement).getAllByRole('row').slice(1);
      await user.click(rows[0]);
    };

    it('should have a "Summary" & "Request" tabs to review the Job', async () => {
      await goToStep(6);
      expect(getTabsText()).toEqual(['Summary', 'Request']);
    });

    it('should have a "Summary", "Terms" & "Request" tab if a term aggregation was added', async () => {
      mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields: ['my-field'] } });
      await goToStep(3);
      await selectFirstField('Terms');

      await actions.clickNextStep();
      await actions.clickNextStep();
      await actions.clickNextStep();

      expect(exists('rollupJobCreateReviewTitle'));
      expect(getTabsText()).toEqual(['Summary', 'Terms', 'Request']);
    });

    it('should have a "Summary", "Histogram" & "Request" tab if a histogram field was added', async () => {
      mockHttpRequest(startMock.http, { indxPatternVldtResp: { numericFields: ['a-field'] } });
      await goToStep(4);
      await selectFirstField('Histogram');
      await form.setInputValue('rollupJobCreateHistogramInterval', '3');

      await actions.clickNextStep();
      await actions.clickNextStep();

      expect(getTabsText()).toEqual(['Summary', 'Histogram', 'Request']);
    });

    it('should have a "Summary", "Metrics" & "Request" tab if a histogram field was added', async () => {
      mockHttpRequest(startMock.http, {
        indxPatternVldtResp: {
          numericFields: ['a-field'],
          dateFields: ['b-field'],
        },
      });
      await goToStep(5);
      await selectFirstField('Metrics');
      await form.selectCheckBox('rollupJobMetricsCheckbox-avg');

      await actions.clickNextStep();

      expect(getTabsText()).toEqual(['Summary', 'Metrics', 'Request']);
    });
  });

  describe('save()', () => {
    const jobCreateApiPath = '/api/rollup/create';
    const jobStartApiPath = '/api/rollup/start';

    describe('without starting job after creation', () => {
      it('should call the "create" Api server endpoint', async () => {
        mockHttpRequest(startMock.http, {
          createdJob: first(JOBS.jobs),
        });

        await goToStep(6);

        expect(startMock.http.put).not.toHaveBeenCalledWith(jobCreateApiPath);
        expect(startMock.http.get).not.toHaveBeenCalledWith(jobStartApiPath);

        await actions.clickSave();

        jest.advanceTimersByTime(500);

        await waitFor(() => {
          expect(startMock.http.put).toHaveBeenCalledWith(jobCreateApiPath, expect.anything());
          expect(startMock.http.get).not.toHaveBeenCalledWith(jobStartApiPath);
        });
      });
    });

    describe('with starting job after creation', () => {
      it('should call the "create" and "start" Api server endpoints', async () => {
        mockHttpRequest(startMock.http, {
          createdJob: first(JOBS.jobs),
        });

        await goToStep(6);

        const toggleCheckbox = screen.getByTestId('rollupJobToggleJobStartAfterCreation');
        await user.click(toggleCheckbox);

        expect(startMock.http.post).not.toHaveBeenCalledWith(jobStartApiPath);

        await actions.clickSave();

        jest.advanceTimersByTime(500);
        jest.advanceTimersByTime(300);

        await waitFor(() => {
          expect(startMock.http.post).toHaveBeenCalledWith(jobStartApiPath, {
            body: JSON.stringify({
              jobIds: ['test-job'],
            }),
          });
        });
      });
    });
  });
});
