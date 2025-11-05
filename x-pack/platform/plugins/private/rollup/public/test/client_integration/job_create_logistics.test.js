/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mockHttpRequest, pageHelpers } from './helpers';
import { screen } from '@testing-library/react';
import { ILLEGAL_CHARACTERS_VISIBLE } from '@kbn/data-views-plugin/public';
import { coreMock, docLinksServiceMock } from '@kbn/core/public/mocks';
import { setHttp, init as initDocumentation } from '../../crud_app/services';

const { setup } = pageHelpers.jobCreate;

describe('Create Rollup Job, step 1: Logistics', () => {
  let find;
  let exists;
  let actions;
  let form;
  let getEuiStepsHorizontalActive;
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
    form = testBed.form;
    getEuiStepsHorizontalActive = testBed.getEuiStepsHorizontalActive;
    user = testBed.user;
  });

  afterEach(() => {
    startMock.http.get.mockClear();
    startMock.http.post.mockClear();
    startMock.http.put.mockClear();
  });

  it('should have the horizontal step active on "Logistics"', () => {
    expect(getEuiStepsHorizontalActive()).toContain('Logistics');
  });

  it('should have the title set to "Logistics"', () => {
    expect(exists('rollupJobCreateLogisticsTitle')).toBe(true);
  });

  it('should have a link to the documentation', () => {
    expect(exists('rollupJobCreateLogisticsDocsButton')).toBe(true);
  });

  test('should have a deprecation callout', () => {
    expect(exists('rollupDeprecationCallout')).toBe(true);
  });

  it('should only have the "next" button visible', () => {
    expect(exists('rollupJobBackButton')).toBe(false);
    expect(exists('rollupJobNextButton')).toBe(true);
    expect(exists('rollupJobSaveButton')).toBe(false);
  });

  it('should display errors when clicking "next" without filling the form', async () => {
    expect(exists('rollupJobCreateStepError')).toBeFalsy();

    await actions.clickNextStep();

    expect(exists('rollupJobCreateStepError')).toBeTruthy();
    expect(form.getErrorsMessages()).toEqual([
      'Name is required.',
      'Index pattern is required.',
      'Rollup index is required.',
    ]);
    expect(find('rollupJobNextButton').disabled).toBe(true);
  });

  describe('form validations', () => {
    describe('index pattern', () => {
      beforeEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(false);
      });

      afterEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should not allow spaces', async () => {
        await form.setInputValue('rollupIndexPattern', 'with space');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Remove the spaces from your index pattern.');
      });

      it('should not allow an unknown index pattern', async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { doesMatchIndices: false } });
        await form.setInputValue('rollupIndexPattern', 'unknown');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain("Index pattern doesn't match any indices.");
      });

      it('should not allow an index pattern without time fields', async () => {
        mockHttpRequest(startMock.http, { indxPatternVldtResp: { dateFields: [] } });
        await form.setInputValue('rollupIndexPattern', 'abc');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain(
          'Index pattern must match indices that contain time fields.'
        );
      });

      it('should not allow an index pattern that matches a rollup index', async () => {
        mockHttpRequest(startMock.http, {
          indxPatternVldtResp: { doesMatchRollupIndices: true },
        });
        await form.setInputValue('rollupIndexPattern', 'abc');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Index pattern must not match rollup indices.');
      });

      it('should not be the same as the rollup index name', async () => {
        await form.setInputValue('rollupIndexPattern', 'abc');
        await form.setInputValue('rollupIndexName', 'abc');
        await actions.clickNextStep();

        const errorMessages = form.getErrorsMessages();
        expect(errorMessages).toContain('Index pattern cannot have the same as the rollup index.');
        expect(errorMessages).toContain('Rollup index cannot have the same as the index pattern.');
      });
    });

    describe('rollup index name', () => {
      beforeEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(false);
      });

      afterEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should not allow spaces', async () => {
        await form.setInputValue('rollupIndexName', 'with space');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain(
          'Remove the spaces from your rollup index name.'
        );
      });

      it('should not allow invalid characters', async () => {
        const expectInvalidChar = async (char) => {
          await form.setInputValue('rollupIndexName', `rollup_index_${char}`);
          await actions.clickNextStep();
          expect(form.getErrorsMessages()).toContain(
            `Remove the characters ${char} from your rollup index name.`
          );
        };

        for (const char of [...ILLEGAL_CHARACTERS_VISIBLE, ',']) {
          await expectInvalidChar(char);
        }
      });

      it('should not allow a dot as first character', async () => {
        await form.setInputValue('rollupIndexName', '.kibana');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Index names cannot begin with periods.');
      });
    });

    describe('rollup cron', () => {
      const changeFrequency = async (value) => {
        const frequencySelect = screen.getByTestId('cronFrequencySelect');
        await user.selectOptions(frequencySelect, value);
      };

      const generateStringSequenceOfNumbers = (total) =>
        new Array(total).fill('').map((_, i) => (i < 10 ? `0${i}` : i.toString()));

      describe('frequency', () => {
        it('should allow "minute", "hour", "day", "week", "month", "year"', () => {
          const frequencySelect = screen.getByTestId('cronFrequencySelect');
          const options = Array.from(frequencySelect.querySelectorAll('option')).map(
            (option) => option.textContent
          );
          expect(options).toEqual(['minute', 'hour', 'day', 'week', 'month', 'year']);
        });

        it('should default to "WEEK"', () => {
          const frequencySelect = screen.getByTestId('cronFrequencySelect');
          expect(frequencySelect.value).toBe('WEEK');
        });

        describe('every minute', () => {
          it('should not have any additional configuration', async () => {
            await changeFrequency('MINUTE');
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(0);
          });
        });

        describe('hourly', () => {
          beforeEach(async () => {
            await changeFrequency('HOUR');
          });

          it('should have 1 additional configuration', () => {
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(1);
            expect(exists('cronFrequencyHourlyMinuteSelect')).toBe(true);
          });

          it('should allow to select any minute from 00 -> 59', () => {
            const minutSelect = screen.getByTestId('cronFrequencyHourlyMinuteSelect');
            const options = Array.from(minutSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(60));
          });
        });

        describe('daily', () => {
          beforeEach(async () => {
            await changeFrequency('DAY');
          });

          it('should have 1 additional configuration with hour and minute selects', () => {
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(1);
            expect(exists('cronFrequencyDailyHourSelect')).toBe(true);
            expect(exists('cronFrequencyDailyMinuteSelect')).toBe(true);
          });

          it('should allow to select any hour from 00 -> 23', () => {
            const hourSelect = screen.getByTestId('cronFrequencyDailyHourSelect');
            const options = Array.from(hourSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(24));
          });

          it('should allow to select any miute from 00 -> 59', () => {
            const minutSelect = screen.getByTestId('cronFrequencyDailyMinuteSelect');
            const options = Array.from(minutSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(60));
          });
        });

        describe('weekly', () => {
          beforeEach(async () => {
            await changeFrequency('WEEK');
          });

          it('should have 2 additional configurations with day, hour and minute selects', () => {
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(2);
            expect(exists('cronFrequencyWeeklyDaySelect')).toBe(true);
            expect(exists('cronFrequencyWeeklyHourSelect')).toBe(true);
            expect(exists('cronFrequencyWeeklyMinuteSelect')).toBe(true);
          });

          it('should allow to select any day of the week', () => {
            const daySelect = screen.getByTestId('cronFrequencyWeeklyDaySelect');
            const options = Array.from(daySelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual([
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ]);
          });

          it('should allow to select any hour from 00 -> 23', () => {
            const hourSelect = screen.getByTestId('cronFrequencyWeeklyHourSelect');
            const options = Array.from(hourSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(24));
          });

          it('should allow to select any miute from 00 -> 59', () => {
            const minutSelect = screen.getByTestId('cronFrequencyWeeklyMinuteSelect');
            const options = Array.from(minutSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(60));
          });
        });

        describe('monthly', () => {
          beforeEach(async () => {
            await changeFrequency('MONTH');
          });

          it('should have 2 additional configurations with date, hour and minute selects', () => {
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(2);
            expect(exists('cronFrequencyMonthlyDateSelect')).toBe(true);
            expect(exists('cronFrequencyMonthlyHourSelect')).toBe(true);
            expect(exists('cronFrequencyMonthlyMinuteSelect')).toBe(true);
          });

          it('should allow to select any date of the month from 1st to 31st', () => {
            const dateSelect = screen.getByTestId('cronFrequencyMonthlyDateSelect');
            const options = Array.from(dateSelect.querySelectorAll('option'));
            expect(options.length).toEqual(31);
          });

          it('should allow to select any hour from 00 -> 23', () => {
            const hourSelect = screen.getByTestId('cronFrequencyMonthlyHourSelect');
            const options = Array.from(hourSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(24));
          });

          it('should allow to select any miute from 00 -> 59', () => {
            const minutSelect = screen.getByTestId('cronFrequencyMonthlyMinuteSelect');
            const options = Array.from(minutSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(60));
          });
        });

        describe('yearly', () => {
          beforeEach(async () => {
            await changeFrequency('YEAR');
          });

          it('should have 3 additional configurations with month, date, hour and minute selects', () => {
            expect(screen.queryAllByTestId('cronFrequencyConfiguration').length).toBe(3);
            expect(exists('cronFrequencyYearlyMonthSelect')).toBe(true);
            expect(exists('cronFrequencyYearlyDateSelect')).toBe(true);
            expect(exists('cronFrequencyYearlyHourSelect')).toBe(true);
            expect(exists('cronFrequencyYearlyMinuteSelect')).toBe(true);
          });

          it('should allow to select any month of the year', () => {
            const monthSelect = screen.getByTestId('cronFrequencyYearlyMonthSelect');
            const options = Array.from(monthSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual([
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
            ]);
          });

          it('should allow to select any date of the month from 1st to 31st', () => {
            const dateSelect = screen.getByTestId('cronFrequencyYearlyDateSelect');
            const options = Array.from(dateSelect.querySelectorAll('option'));
            expect(options.length).toEqual(31);
          });

          it('should allow to select any hour from 00 -> 23', () => {
            const hourSelect = screen.getByTestId('cronFrequencyYearlyHourSelect');
            const options = Array.from(hourSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(24));
          });

          it('should allow to select any miute from 00 -> 59', () => {
            const minutSelect = screen.getByTestId('cronFrequencyYearlyMinuteSelect');
            const options = Array.from(minutSelect.querySelectorAll('option')).map(
              (option) => option.textContent
            );
            expect(options).toEqual(generateStringSequenceOfNumbers(60));
          });
        });
      });

      describe('advanced cron expression', () => {
        const activateAdvancedCronExpression = async () => {
          await user.click(screen.getByTestId('rollupShowAdvancedCronLink'));
        };

        it('should allow to create a cron expression', async () => {
          expect(exists('rollupAdvancedCron')).toBe(false);

          await activateAdvancedCronExpression();

          expect(exists('rollupAdvancedCron')).toBe(true);
        });

        it('should not be empty', async () => {
          await activateAdvancedCronExpression();

          await form.setInputValue('rollupAdvancedCron', '');
          await actions.clickNextStep();

          expect(form.getErrorsMessages()).toContain('Cron pattern or basic interval is required.');
        });

        it('should not allow unvalid expression', async () => {
          await activateAdvancedCronExpression();

          await form.setInputValue('rollupAdvancedCron', 'invalid');
          await actions.clickNextStep();

          expect(form.getErrorsMessages()).toContain(
            'Expression has only 1 part. At least 5 parts are required.'
          );
        });
      });
    });

    describe('page size', () => {
      beforeEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(false);
      });

      afterEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should not be empty', async () => {
        await form.setInputValue('rollupPageSize', '');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Page size is required.');
      });

      it('should be greater than 0', async () => {
        await form.setInputValue('rollupPageSize', '-1');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Page size must be greater than zero.');
      });
    });

    describe('delay', () => {
      beforeEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(false);
      });

      afterEach(() => {
        expect(find('rollupJobNextButton').disabled).toBe(true);
      });

      it('should validate the interval format', async () => {
        await form.setInputValue('rollupDelay', 'abc');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain('Invalid delay format.');
      });

      it('should validate the calendar format', async () => {
        await form.setInputValue('rollupDelay', '3y');
        await actions.clickNextStep();
        expect(form.getErrorsMessages()).toContain(`The 'y' unit only allows values of 1. Try 1y.`);
      });
    });
  });
});
