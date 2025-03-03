/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { useEuiTheme } from '@elastic/eui';
import { getVizColorForIndex } from '../../../../common/viz_colors';
import type { Coordinate, TimeSeries } from '../../../../typings/timeseries';
import { useApmServiceContext } from '../../../context/apm_service/use_apm_service_context';
import { useAnyOfApmParams } from '../../../hooks/use_apm_params';
import { useFetcher } from '../../../hooks/use_fetcher';
import { useTimeRange } from '../../../hooks/use_time_range';
import { BreakdownChart } from '../../shared/charts/breakdown_chart';

export function ServiceDependenciesBreakdownChart({ height }: { height: number }) {
  const { serviceName } = useApmServiceContext();
  const { euiTheme } = useEuiTheme();

  const {
    query: { kuery, environment, rangeFrom, rangeTo },
  } = useAnyOfApmParams(
    '/services/{serviceName}/dependencies',
    '/mobile-services/{serviceName}/dependencies'
  );

  const { start, end } = useTimeRange({ rangeFrom, rangeTo });

  const { data, status } = useFetcher(
    (callApmApi) => {
      return callApmApi('GET /internal/apm/services/{serviceName}/dependencies/breakdown', {
        params: {
          path: {
            serviceName,
          },
          query: {
            start,
            end,
            kuery,
            environment,
          },
        },
      });
    },
    [serviceName, start, end, kuery, environment]
  );

  const timeseries: Array<TimeSeries<Coordinate>> =
    data?.breakdown.map((item, index) => {
      return {
        title: item.title,
        data: item.data,
        type: 'area',
        color: getVizColorForIndex(index, euiTheme),
      };
    }) ?? [];

  return (
    <BreakdownChart
      fetchStatus={status}
      height={height}
      showAnnotations={false}
      annotations={[]}
      timeseries={timeseries}
      yAxisType="duration"
      id="serviceDependenciesBreakdownChart"
    />
  );
}
