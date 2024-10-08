/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { IKibanaSearchResponse } from '@kbn/search-types';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { AggregateQuery, Filter, Query } from '@kbn/es-query';
import { SearchSourceSearchOptions } from '../../..';
import { GetConfigFn } from '../../../types';

/**
 * @internal
 *
 * This type is used when flattenning a SearchSource and passing it down to legacy search.
 * Once legacy search is removed, this type should become internal to `SearchSource`,
 * where `ISearchRequestParams` is used externally instead.
 * FIXME: replace with estypes.SearchRequest?
 */
export type SearchRequest<T extends Record<string, any> = Record<string, any>> = {
  index?: DataView | string;
  query?: Array<Query | AggregateQuery>;
  filters?: Filter[] | (() => Filter[]);
} & Omit<T, 'index' | 'query' | 'filters'>;

export interface FetchHandlers {
  getConfig: GetConfigFn;
  /**
   * Callback which can be used to hook into responses, modify them, or perform
   * side effects like displaying UI errors on the client.
   */
  onResponse: (
    request: SearchRequest,
    response: IKibanaSearchResponse,
    options: SearchSourceSearchOptions
  ) => IKibanaSearchResponse;
}

export interface SearchError {
  name: string;
  status: string;
  title: string;
  message: string;
  path: string;
  type: string;
}
