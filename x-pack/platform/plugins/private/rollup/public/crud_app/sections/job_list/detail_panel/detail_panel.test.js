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
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../../../test/client_integration/helpers/setup_context';
import { getJob } from '../../../../../fixtures';
import { rollupJobsStore } from '../../../store';
import { DetailPanel } from './detail_panel';
import {
  JOB_DETAILS_TAB_SUMMARY,
  JOB_DETAILS_TAB_TERMS,
  JOB_DETAILS_TAB_HISTOGRAM,
  JOB_DETAILS_TAB_METRICS,
  JOB_DETAILS_TAB_JSON,
  tabToHumanizedMap,
} from '../../components';

jest.mock('../../../../kibana_services', () => {
  const services = jest.requireActual('../../../../kibana_services');
  return {
    ...services,
    trackUiMetric: jest.fn(),
  };
});

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

const renderDetailPanel = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  
  const Wrapper = ({ children }) => (
    <Provider store={rollupJobsStore}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </Provider>
  );

  return renderWithProviders(<DetailPanel {...mergedProps} />, { wrapper: Wrapper });
};

describe('<DetailPanel />', () => {
  describe('layout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should have the title set to the current Job "id"', () => {
      renderDetailPanel();
      const { job } = defaultProps;
      const title = screen.getByTestId('rollupJobDetailsFlyoutTitle');
      expect(title).toBeInTheDocument();
      expect(title.textContent).toEqual(job.id);
    });

    it("should have children if it's open", () => {
      const { container } = renderDetailPanel();
      const detailPanel = container.querySelector('[data-test-subj="rollupJobDetailFlyout"]');
      expect(detailPanel?.children.length).toBeGreaterThan(0);
    });

    it('should *not* have children if its closed', () => {
      const { container } = renderDetailPanel({ isOpen: false });
      const detailPanel = container.querySelector('[data-test-subj="rollupJobDetailFlyout"]');
      expect(detailPanel?.children.length || 0).toBe(0);
    });

    it('should show a loading when the job is loading', () => {
      renderDetailPanel({ isLoading: true });
      const loading = screen.getByTestId('rollupJobDetailLoading');
      expect(loading).toBeInTheDocument();
      expect(loading.textContent).toEqual('Loading rollup job…');

      // Make sure the title and the tabs are visible
      expect(screen.getByTestId('rollupJobDetailsFlyoutTitle')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should display a message when no job is provided', () => {
      renderDetailPanel({ job: undefined });
      expect(screen.getByTestId('rollupJobDetailJobNotFound').textContent).toEqual(
        'Rollup job not found'
      );
    });
  });

  describe('tabs', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should have 5 tabs visible', () => {
      renderDetailPanel({ panelType: JOB_DETAILS_TAB_SUMMARY });
      const tabs = screen.getAllByRole('tab');
      const tabsLabel = tabs.map((tab) => tab.textContent);

      expect(tabsLabel).toEqual(['Summary', 'Terms', 'Histogram', 'Metrics', 'JSON']);
    });

    it('should set default selected tab to the "panelType" prop provided', () => {
      renderDetailPanel({ panelType: JOB_DETAILS_TAB_SUMMARY });
      const summaryTab = screen.getByRole('tab', { name: 'Summary' });
      expect(summaryTab.getAttribute('aria-selected')).toBe('true');
    });

    it('should select the tab when clicking on it', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const { job, openDetailPanel } = defaultProps;
      
      renderDetailPanel({ panelType: JOB_DETAILS_TAB_SUMMARY });
      const termsTab = screen.getByRole('tab', { name: 'Terms' });

      await user.click(termsTab);

      expect(openDetailPanel).toHaveBeenCalledTimes(1);
      expect(openDetailPanel).toHaveBeenCalledWith({
        jobId: job.id,
        panelType: JOB_DETAILS_TAB_TERMS,
      });
    });
  });

  describe('job detail', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('summary tab content', () => {
      beforeEach(() => {
        renderDetailPanel({ panelType: JOB_DETAILS_TAB_SUMMARY });
      });

      it('should have a "Logistics", "Date histogram" and "Stats" section', () => {
        expect(screen.getByTestId('rollupJobDetailSummaryLogisticsSection')).toBeInTheDocument();
        expect(screen.getByTestId('rollupJobDetailSummaryDateHistogramSection')).toBeInTheDocument();
        expect(screen.getByTestId('rollupJobDetailSummaryStatsSection')).toBeInTheDocument();
      });

      describe('Logistics section', () => {
        const LOGISTICS_SUBSECTIONS = ['IndexPattern', 'RollupIndex', 'Cron', 'Delay'];

        it('should have "Index pattern", "Rollup index", "Cron" and "Delay" subsections', () => {
          LOGISTICS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailLogistics${subSection}Title`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          LOGISTICS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(
              `rollupJobDetailLogistics${subSection}Description`
            ).textContent;

            switch (subSection) {
              case 'IndexPattern':
                expect(description).toEqual(defaultJob.indexPattern);
                break;
              case 'Cron':
                expect(description).toEqual(defaultJob.rollupCron);
                break;
              case 'Delay':
                expect(description).toEqual(defaultJob.rollupDelay);
                break;
              case 'RollupIndex':
                expect(description).toEqual(defaultJob.rollupIndex);
                break;
              default:
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
          DATE_HISTOGRAMS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailDateHistogram${subSection}Title`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          DATE_HISTOGRAMS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(
              `rollupJobDetailDateHistogram${subSection}Description`
            ).textContent;

            switch (subSection) {
              case 'TimeField':
                expect(description).toEqual(defaultJob.dateHistogramField);
                break;
              case 'Interval':
                expect(description).toEqual(defaultJob.dateHistogramInterval);
                break;
              case 'Timezone':
                expect(description).toEqual(defaultJob.dateHistogramTimeZone);
                break;
              default:
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
          STATS_SUBSECTIONS.forEach((subSection) => {
            expect(
              screen.getByTestId(`rollupJobDetailStats${subSection}Title`)
            ).toBeInTheDocument();
          });
        });

        it('should set the correct job value for each of the subsection', () => {
          STATS_SUBSECTIONS.forEach((subSection) => {
            const description = screen.getByTestId(
              `rollupJobDetailStats${subSection}Description`
            ).textContent;

            switch (subSection) {
              case 'DocumentsProcessed':
                expect(description).toEqual(defaultJob.documentsProcessed.toString());
                break;
              case 'PagesProcessed':
                expect(description).toEqual(defaultJob.pagesProcessed.toString());
                break;
              case 'RollupsIndexed':
                expect(description).toEqual(defaultJob.rollupsIndexed.toString());
                break;
              case 'TriggerCount':
                expect(description).toEqual(defaultJob.triggerCount.toString());
                break;
              default:
                throw new Error(
                  'Should not get here. The constant STATS_SUBSECTIONS is probably missing a new subsection'
                );
            }
          });
        });

        it('should display the job status', () => {
          const statsSection = screen.getByTestId('rollupJobDetailSummaryStatsSection');
          expect(statsSection).toBeInTheDocument();
          expect(defaultJob.status).toEqual('stopped');
          expect(within(statsSection).getByText('Stopped')).toBeInTheDocument();
        });
      });
    });

    describe('terms tab content', () => {
      it('should list the Job terms fields', () => {
        renderDetailPanel({ panelType: JOB_DETAILS_TAB_TERMS });
        const table = screen.getByTestId('detailPanelTermsTabTable');
        const rows = within(table).getAllByRole('row');
        
        // Skip header row
        const dataRows = rows.slice(1);
        expect(dataRows.length).toBe(defaultJob.terms.length);
        
        defaultJob.terms.forEach((term, index) => {
          expect(within(dataRows[index]).getByText(term.name)).toBeInTheDocument();
        });
      });
    });

    describe('histogram tab content', () => {
      it('should list the Job histogram fields', () => {
        renderDetailPanel({ panelType: JOB_DETAILS_TAB_HISTOGRAM });
        const table = screen.getByTestId('detailPanelHistogramTabTable');
        const rows = within(table).getAllByRole('row');
        
        // Skip header row
        const dataRows = rows.slice(1);
        expect(dataRows.length).toBe(defaultJob.histogram.length);
        
        defaultJob.histogram.forEach((h, index) => {
          expect(within(dataRows[index]).getByText(h.name)).toBeInTheDocument();
        });
      });
    });

    describe('metrics tab content', () => {
      it('should list the Job metrics fields and their types', () => {
        renderDetailPanel({ panelType: JOB_DETAILS_TAB_METRICS });
        const table = screen.getByTestId('detailPanelMetricsTabTable');
        const rows = within(table).getAllByRole('row');
        
        // Skip header row
        const dataRows = rows.slice(1);
        expect(dataRows.length).toBe(defaultJob.metrics.length);
        
        defaultJob.metrics.forEach((metric, index) => {
          const row = dataRows[index];
          expect(within(row).getByText(metric.name)).toBeInTheDocument();
          expect(within(row).getByText(metric.types.join(', '))).toBeInTheDocument();
        });
      });
    });

    describe('JSON tab content', () => {
      it('should render the "CodeEditor" with the job "json" data', () => {
        renderDetailPanel({ panelType: JOB_DETAILS_TAB_JSON });
        const tabContent = screen.getByTestId('rollupJobDetailTabContent');
        const codeBlock = within(tabContent).getByTestId('jsonCodeBlock');
        expect(JSON.parse(codeBlock.textContent)).toEqual(defaultJob.json);
      });
    });
  });
});
