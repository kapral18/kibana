/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockHttpRequest, pageHelpers } from './helpers';
import { screen, within } from '@testing-library/react';
import { setHttp, init as initDocumentation } from '../../crud_app/services';
import { JOB_TO_CLONE, JOB_CLONE_INDEX_PATTERN_CHECK } from './helpers/constants';
import { coreMock, docLinksServiceMock } from '@kbn/core/public/mocks';

const { setup } = pageHelpers.jobClone;
const {
  jobs: [{ config: jobConfig }],
} = JOB_TO_CLONE;

describe('Cloning a rollup job through create job wizard', () => {
  let find;
  let exists;
  let form;
  let table;
  let actions;
  let startMock;
  let user;

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
    mockHttpRequest(startMock.http, { indxPatternVldtResp: JOB_CLONE_INDEX_PATTERN_CHECK });
    const testBed = setup();
    find = (testSubj) => screen.queryByTestId(testSubj);
    exists = (testSubj) => screen.queryByTestId(testSubj) !== null;
    form = testBed.form;
    actions = testBed.actions;
    table = testBed.table;
    user = testBed.user;
  });

  afterEach(() => {
    startMock.http.get.mockClear();
    startMock.http.post.mockClear();
    startMock.http.put.mockClear();
  });

  it('should have fields correctly pre-populated', async () => {
    // Step 1: Logistics
    expect(find('rollupJobName').value).toBe(jobConfig.id + '-copy');
    expect(form.getErrorsMessages()).toEqual([]);
    expect(exists('rollupAdvancedCron')).toBe(true);

    expect(find('rollupAdvancedCron').value).toBe(jobConfig.cron);
    expect(find('rollupPageSize').value).toBe(jobConfig.page_size.toString());
    const {
      groups: { date_histogram: dateHistogram },
    } = jobConfig;
    expect(find('rollupDelay').value).toBe(dateHistogram.delay);

    await form.setInputValue('rollupJobName', 't3');
    await form.setInputValue('rollupIndexName', 't3');

    await actions.clickNextStep();

    // Step 2: Date histogram
    expect(find('rollupJobCreateDateFieldSelect').value).toBe(dateHistogram.field);
    expect(find('rollupJobInterval').value).toBe(dateHistogram.calendar_interval);
    expect(find('rollupJobCreateTimeZoneSelect').value).toBe(dateHistogram.time_zone);

    await actions.clickNextStep();

    // Step 3: Terms
    const { tableCellsValues: tableCellValuesTerms } = table.getMetaData('rollupJobTermsFieldList');
    const {
      groups: {
        terms: { fields: terms },
      },
    } = jobConfig;

    expect(tableCellValuesTerms.length).toBe(terms.length);
    for (const [keyword] of tableCellValuesTerms) {
      expect(terms.find((term) => term === keyword)).toBe(keyword);
    }

    await actions.clickNextStep();

    // Step 4: Histogram
    const { tableCellsValues: tableCellValuesHisto } = table.getMetaData(
      'rollupJobHistogramFieldList'
    );

    const {
      groups: {
        histogram: { fields: histogramsTerms },
      },
    } = jobConfig;

    expect(tableCellValuesHisto.length).toBe(histogramsTerms.length);
    for (const [keyword] of tableCellValuesHisto) {
      expect(histogramsTerms.find((term) => term === keyword)).toBe(keyword);
    }

    await actions.clickNextStep();

    // Step 5: Metrics
    const { metrics } = jobConfig;
    const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
    const metricsRows = within(metricsTable).getAllByRole('row').slice(1);

    metricsRows.forEach((metricRow, idx) => {
      const { metrics: checkedMetrics } = metrics[idx];
      const checkboxes = within(metricRow).getAllByRole('checkbox');

      let checkedCountActual = 0;
      const checkedCountExpected = checkedMetrics.length;

      checkboxes.forEach((checkbox) => {
        const testSubj = checkbox.getAttribute('data-test-subj');
        const shouldBeChecked = checkedMetrics.some(
          (checkedMetric) => testSubj === `rollupJobMetricsCheckbox-${checkedMetric}`
        );
        if (shouldBeChecked) ++checkedCountActual;
        expect(checkbox.checked).toBe(shouldBeChecked);
      });
      expect(checkedCountActual).toBe(checkedCountExpected);
    });
  });

  it('should correctly reset defaults after index pattern changes', async () => {
    // 1. Logistics
    expect(find('rollupJobName').value).toBe(jobConfig.id + '-copy');

    await form.setInputValue('rollupIndexPattern', 'test');

    const {
      groups: { date_histogram: dateHistogram },
    } = jobConfig;

    await actions.clickNextStep();

    // 2. Date Histogram
    expect(exists('rollupJobCreateDateHistogramTitle')).toBe(true);
    expect(find('rollupJobCreateDateFieldSelect').value).toBe(dateHistogram.field);

    await actions.clickNextStep();

    // 3. Terms
    expect(exists('rollupJobCreateTermsTitle')).toBe(true);
    const { tableCellsValues: tableCellValuesTerms } = table.getMetaData('rollupJobTermsFieldList');
    expect(tableCellValuesTerms[0][0]).toBe('No terms fields added');

    await actions.clickNextStep();

    // 4. Histogram
    expect(exists('rollupJobCreateHistogramTitle')).toBe(true);
    const { tableCellsValues: tableCellValuesHisto } = table.getMetaData(
      'rollupJobHistogramFieldList'
    );

    expect(tableCellValuesHisto[0][0]).toBe('No histogram fields added');

    await actions.clickNextStep();

    // 5. Metrics
    expect(exists('rollupJobCreateMetricsTitle')).toBe(true);
    const metricsTable = screen.getByTestId('rollupJobMetricsFieldList');
    const metricsRows = within(metricsTable).getAllByRole('row').slice(1);
    expect(metricsRows.length).toBe(1);

    // 6. Review
    await actions.clickNextStep();

    expect(exists('rollupJobCreateReviewTitle')).toBe(true);
  });
});
