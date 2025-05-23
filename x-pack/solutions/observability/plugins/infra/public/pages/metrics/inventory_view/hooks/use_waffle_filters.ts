/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { fromKueryExpression } from '@kbn/es-query';
import { useState, useMemo, useCallback, useEffect } from 'react';

import { pipe } from 'fp-ts/pipeable';
import { fold } from 'fp-ts/Either';
import { constant, identity } from 'fp-ts/function';
import createContainter from 'constate';
import { useUrlState } from '@kbn/observability-shared-plugin/public';
import {
  type InventoryFiltersState,
  inventoryFiltersStateRT,
} from '../../../../../common/inventory_views';
import { useAlertPrefillContext } from '../../../../alerting/use_alert_prefill';
import { useMetricsDataViewContext } from '../../../../containers/metrics_source';
import { convertKueryToElasticSearchQuery } from '../../../../utils/kuery';

const validateKuery = (expression: string) => {
  try {
    fromKueryExpression(expression);
  } catch (err) {
    return false;
  }
  return true;
};

export const DEFAULT_WAFFLE_FILTERS_STATE: InventoryFiltersState = {
  kind: 'kuery',
  expression: '',
};

export const useWaffleFilters = () => {
  const { metricsView } = useMetricsDataViewContext();

  const [urlState, setUrlState] = useUrlState<InventoryFiltersState>({
    defaultState: DEFAULT_WAFFLE_FILTERS_STATE,
    decodeUrlState,
    encodeUrlState,
    urlStateKey: 'waffleFilter',
  });

  const [state, setState] = useState<InventoryFiltersState>(urlState);

  useEffect(() => setUrlState(state), [setUrlState, state]);

  const [filterQueryDraft, setFilterQueryDraft] = useState<string>(urlState.expression);

  const filterQueryAsJson = useMemo(
    () => convertKueryToElasticSearchQuery(urlState.expression, metricsView?.dataViewReference),
    [metricsView?.dataViewReference, urlState.expression]
  );

  const applyFilterQueryFromKueryExpression = useCallback(
    (expression: string) => {
      setState((previous) => ({
        ...previous,
        kind: 'kuery',
        expression,
      }));
    },
    [setState]
  );

  const applyFilterQuery = useCallback((filterQuery: InventoryFiltersState) => {
    setState(filterQuery);
    setFilterQueryDraft(filterQuery.expression);
  }, []);

  const isFilterQueryDraftValid = useMemo(
    () => validateKuery(filterQueryDraft),
    [filterQueryDraft]
  );

  const { inventoryPrefill } = useAlertPrefillContext();
  const prefillContext = useMemo(() => inventoryPrefill, [inventoryPrefill]); // For Jest compatibility
  useEffect(() => prefillContext.setFilterQuery(state.expression), [prefillContext, state]);

  return {
    filterQuery: urlState,
    filterQueryDraft,
    filterQueryAsJson,
    applyFilterQuery,
    setFilterQueryDraftFromKueryExpression: setFilterQueryDraft,
    applyFilterQueryFromKueryExpression,
    isFilterQueryDraftValid,
    setWaffleFiltersState: applyFilterQuery,
  };
};

// temporary
export type WaffleFiltersState = InventoryFiltersState;
const encodeUrlState = inventoryFiltersStateRT.encode;
const decodeUrlState = (value: unknown) =>
  pipe(inventoryFiltersStateRT.decode(value), fold(constant(undefined), identity));
export const WaffleFilters = createContainter(useWaffleFilters);
export const [WaffleFiltersProvider, useWaffleFiltersContext] = WaffleFilters;
