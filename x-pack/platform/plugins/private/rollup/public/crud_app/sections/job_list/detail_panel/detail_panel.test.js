/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { renderWithI18n } from '@kbn/test-jest-helpers';

import { getJob } from '../../../../../fixtures';
import { rollupJobsStore } from '../../../store';
import { DetailPanel } from './detail_panel';
import {
  JOB_DETAILS_TAB_SUMMARY,
  JOB_DETAILS_TAB_TERMS,
  JOB_DETAILS_TAB_HISTOGRAM,
  JOB_DETAILS_TAB_METRICS,
  JOB_DETAILS_TAB_JSON,
} from '../../components';

jest.mock('../../../../kibana_services', () => {
  const services = jest.requireActual('../../../../kibana_services');
  return {
    ...services,
    trackUiMetric: jest.fn(),
  };
});

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
});

const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const defaultJob = getJob();

const defaultProps = {
  isOpen: true,
  isLoading: false,
  job: defaultJob,
  jobId: defaultJob.id,
  panelType: JOB_DETAILS_TAB_SUMMARY,
  closeDetailPanel: jest.fn(),
  openDetailPanel: jest.fn(),
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return renderWithI18n(
    <Provider store={rollupJobsStore}>
      <DetailPanel {...mergedProps} />
    </Provider>
  );
};

describe('<DetailPanel />', () => {
  describe('layout', () => {
    it('should have the title set to the current Job "id"', () => {
      renderComponent();
      const { job } = defaultProps;
      const title = screen.getByTestId('rollupJobDetailsFlyoutTitle');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(job.id);
    });

    it("should have children if it's open", () => {
      const { container } = renderComponent();
      // When open, the flyout should have visible content
      expect(
        container.querySelector('[data-test-subj="rollupJobDetailsFlyoutTitle"]')
      ).toBeInTheDocument();
    });

    it('should *not* have children if its closed', () => {
      const { container } = renderComponent({ isOpen: false });
      // When closed, the flyout title should not be visible
      expect(
        container.querySelector('[data-test-subj="rollupJobDetailsFlyoutTitle"]')
      ).not.toBeInTheDocument();
    });

    it('should show a loading when the job is loading', () => {
      renderComponent({ isLoading: true });
      const loading = screen.getByTestId('rollupJobDetailLoading');
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveTextContent('Loading rollup job…');

      // Make sure the title and the tabs are visible
      expect(screen.getByTestId('detailPanelTabSelected')).toBeInTheDocument();
      expect(screen.getByTestId('rollupJobDetailsFlyoutTitle')).toBeInTheDocument();
    });

    it('should display a message when no job is provided', () => {
      renderComponent({ job: undefined });
      const notFound = screen.getByTestId('rollupJobDetailJobNotFound');
      expect(notFound).toHaveTextContent('Rollup job not found');
    });
  });

  describe('tabs', () => {
    const getTabByText = (text) => {
      return screen.getByRole('tab', { name: text });
    };

    it('should have 5 tabs visible', () => {
      renderComponent({ panelType: JOB_DETAILS_TAB_SUMMARY });

      expect(getTabByText('Summary')).toBeInTheDocument();
      expect(getTabByText('Terms')).toBeInTheDocument();
      expect(getTabByText('Histogram')).toBeInTheDocument();
      expect(getTabByText('Metrics')).toBeInTheDocument();
      expect(getTabByText('JSON')).toBeInTheDocument();
    });

    it('should set default selected tab to the "panelType" prop provided', () => {
      renderComponent({ panelType: JOB_DETAILS_TAB_SUMMARY });
      const summaryTab = getTabByText('Summary');
      expect(summaryTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should select the tab when clicking on it', async () => {
      const openDetailPanel = jest.fn();
      renderComponent({ openDetailPanel });

      const { job } = defaultProps;
      const termsTab = getTabByText('Terms');

      await user.click(termsTab);

      expect(openDetailPanel).toHaveBeenCalledTimes(1);
      expect(openDetailPanel).toHaveBeenCalledWith({
        jobId: job.id,
        panelType: JOB_DETAILS_TAB_TERMS,
      });
    });
  });

  describe('job detail', () => {
    describe('summary tab content', () => {
      beforeEach(() => {
        renderComponent({ panelType: JOB_DETAILS_TAB_SUMMARY });
      });

      it('should have a "Logistics", "Date histogram" and "Stats" section', () => {
        expect(screen.getByTestId('rollupJobDetailSummaryLogisticsSection')).toBeInTheDocument();
        expect(
          screen.getByTestId('rollupJobDetailSummaryDateHistogramSection')
        ).toBeInTheDocument();
        expect(screen.getByTestId('rollupJobDetailSummaryStatsSection')).toBeInTheDocument();
      });

      describe('Logistics section', () => {
        const LOGISTICS_SUBSECTIONS = ['IndexPattern', 'RollupIndex', 'Cron', 'Delay'];

        it('should have "Index pattern", "Rollup index", "Cron" and "Delay" subsections', () => {
          // Check for the description elements which have data-test-subj
          LOGISTICS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailLogistics${subSection}Description`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          LOGISTICS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(
              `rollupJobDetailLogistics${subSection}Description`
            );
            expect(description).toBeInTheDocument();

            switch (subSection) {
              case 'IndexPattern':
                expect(description).toHaveTextContent(defaultJob.indexPattern);
                break;
              case 'Cron':
                expect(description).toHaveTextContent(defaultJob.rollupCron);
                break;
              case 'Delay':
                expect(description).toHaveTextContent(defaultJob.rollupDelay);
                break;
              case 'RollupIndex':
                expect(description).toHaveTextContent(defaultJob.rollupIndex);
                break;
              default:
                // Should never get here... if it does a section is missing in the constant
                throw new Error(
                  'Should not get here. The constant LOGISTICS_SUBSECTIONS is probably missing a new subsection'
                );
            }
          });
        });
      });

      describe('Date histogram section', () => {
        const DATE_HISTOGRAMS_SUBSECTIONS = ['TimeField', 'Timezone', 'Interval'];

        it('should have "Time field", "Timezone", "Interval" subsections', () => {
          // Check for the description elements which have data-test-subj
          DATE_HISTOGRAMS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailDateHistogram${subSection}Description`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          DATE_HISTOGRAMS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(
              `rollupJobDetailDateHistogram${subSection}Description`
            );
            expect(description).toBeInTheDocument();

            switch (subSection) {
              case 'TimeField':
                expect(description).toHaveTextContent(defaultJob.dateHistogramField);
                break;
              case 'Interval':
                expect(description).toHaveTextContent(defaultJob.dateHistogramInterval);
                break;
              case 'Timezone':
                expect(description).toHaveTextContent(defaultJob.dateHistogramTimeZone);
                break;
              default:
                // Should never get here... if it does a section is missing in the constant
                throw new Error(
                  'Should not get here. The constant DATE_HISTOGRAMS_SUBSECTIONS is probably missing a new subsection'
                );
            }
          });
        });
      });

      describe('Stats section', () => {
        const STATS_SUBSECTIONS = [
          'DocumentsProcessed',
          'PagesProcessed',
          'RollupsIndexed',
          'TriggerCount',
        ];

        it('should have "Documents processed", "Pages processed", "Rollups indexed" and "Trigger count" subsections', () => {
          // Check for the description elements which have data-test-subj
          STATS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailStats${subSection}Description`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          STATS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(`rollupJobDetailStats${subSection}Description`);
            expect(description).toBeInTheDocument();

            switch (subSection) {
              case 'DocumentsProcessed':
                expect(description).toHaveTextContent(defaultJob.documentsProcessed.toString());
                break;
              case 'PagesProcessed':
                expect(description).toHaveTextContent(defaultJob.pagesProcessed.toString());
                break;
              case 'RollupsIndexed':
                expect(description).toHaveTextContent(defaultJob.rollupsIndexed.toString());
                break;
              case 'TriggerCount':
                expect(description).toHaveTextContent(defaultJob.triggerCount.toString());
                break;
              default:
                // Should never get here... if it does a section is missing in the constant
                throw new Error(
                  'Should not get here. The constant STATS_SUBSECTIONS is probably missing a new subsection'
                );
            }
          });
        });

        it('should display the job status', () => {
          const statsSection = screen.getByTestId('rollupJobDetailSummaryStatsSection');
          expect(statsSection).toBeInTheDocument();
          expect(defaultJob.status).toEqual('stopped'); // make sure status is Stopped
          expect(within(statsSection).getByText('Stopped')).toBeInTheDocument();
        });
      });
    });

    describe('terms tab content', () => {
      beforeEach(() => {
        renderComponent({ panelType: JOB_DETAILS_TAB_TERMS });
      });

      it('should list the Job terms fields', () => {
        const table = screen.getByTestId('detailPanelTermsTabTable');
        expect(table).toBeInTheDocument();

        // Check that each term name is present in the table
        defaultJob.terms.forEach((term) => {
          expect(within(table).getByText(term.name)).toBeInTheDocument();
        });
      });
    });

    describe('histogram tab content', () => {
      beforeEach(() => {
        renderComponent({ panelType: JOB_DETAILS_TAB_HISTOGRAM });
      });

      it('should list the Job histogram fields', () => {
        const table = screen.getByTestId('detailPanelHistogramTabTable');
        expect(table).toBeInTheDocument();

        // Check that each histogram name is present in the table
        defaultJob.histogram.forEach((h) => {
          expect(within(table).getByText(h.name)).toBeInTheDocument();
        });
      });
    });

    describe('metrics tab content', () => {
      beforeEach(() => {
        renderComponent({ panelType: JOB_DETAILS_TAB_METRICS });
      });

      it('should list the Job metrics fields and their types', () => {
        const table = screen.getByTestId('detailPanelMetricsTabTable');
        expect(table).toBeInTheDocument();

        // Check that each metric name and types are present in the table
        defaultJob.metrics.forEach((metric) => {
          expect(within(table).getByText(metric.name)).toBeInTheDocument();
          expect(within(table).getByText(metric.types.join(', '))).toBeInTheDocument();
        });
      });
    });

    describe('JSON tab content', () => {
      beforeEach(() => {
        renderComponent({ panelType: JOB_DETAILS_TAB_JSON });
      });

      it('should render the "CodeEditor" with the job "json" data', () => {
        const codeBlock = screen.getByTestId('jsonCodeBlock');
        expect(JSON.parse(codeBlock.textContent)).toEqual(defaultJob.json);
      });
    });
  });
});
