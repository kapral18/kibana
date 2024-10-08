/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { LegendValue } from '@elastic/charts';
import { METRIC_TYPES, BUCKET_TYPES } from '@kbn/data-plugin/common';

export const SAVED_OBJECTS_LIMIT_SETTING = 'savedObjects:listingLimit';
export const SAVED_OBJECTS_PER_PAGE_SETTING = 'savedObjects:perPage';
export const VISUALIZE_EMBEDDABLE_TYPE = 'visualization';

export const STATE_STORAGE_KEY = '_a';
export const GLOBAL_STATE_STORAGE_KEY = '_g';

export const VISUALIZE_APP_NAME = 'visualize';

export const VisualizeConstants = {
  VISUALIZE_BASE_PATH: '/app/visualize',
  LANDING_PAGE_PATH: '/',
  LANDING_PAGE_PATH_WITH_TAB: '/:activeTab',
  WIZARD_STEP_1_PAGE_PATH: '/new',
  WIZARD_STEP_2_PAGE_PATH: '/new/configure',
  CREATE_PATH: '/create',
  EDIT_PATH: '/edit',
  EDIT_BY_VALUE_PATH: '/edit_by_value',
  APP_ID: 'visualize',
};

export enum LegendSize {
  AUTO = 'auto',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'xlarge',
}

export enum LegendLayout {
  Table = 'table',
  List = 'list',
}

export const LegendSizeToPixels = {
  [LegendSize.AUTO]: undefined,
  [LegendSize.SMALL]: 80,
  [LegendSize.MEDIUM]: 130,
  [LegendSize.LARGE]: 180,
  [LegendSize.EXTRA_LARGE]: 230,
} as const;

export const DEFAULT_LEGEND_SIZE = LegendSize.MEDIUM;

export const SUPPORTED_AGGREGATIONS = [
  ...Object.values(METRIC_TYPES),
  ...Object.values(BUCKET_TYPES),
] as const;

export type XYLegendValue = Extract<
  LegendValue,
  | 'currentAndLastValue'
  | 'lastValue'
  | 'lastNonNullValue'
  | 'average'
  | 'median'
  | 'max'
  | 'min'
  | 'firstValue'
  | 'firstNonNullValue'
  | 'total'
  | 'count'
  | 'distinctCount'
  | 'variance'
  | 'stdDeviation'
  | 'range'
  | 'difference'
  | 'differencePercent'
>;

export type PartitionLegendValue = Extract<LegendValue, 'value' | 'percent'>;
