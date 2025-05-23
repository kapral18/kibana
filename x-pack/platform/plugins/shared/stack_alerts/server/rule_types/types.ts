/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { StackAlert } from '@kbn/alerts-as-data-utils';
import type { CoreSetup, Logger } from '@kbn/core/server';
import type { AlertingServerSetup, StackAlertsStartDeps } from '../types';

export interface RegisterRuleTypesParams {
  logger: Logger;
  data: Promise<StackAlertsStartDeps['triggersActionsUi']['data']>;
  alerting: AlertingServerSetup;
  core: CoreSetup;
}

export type StackAlertType = Omit<StackAlert, 'kibana.alert.evaluation.threshold'> & {
  // Defining a custom type for this because the schema generation script doesn't allow explicit null values
  'kibana.alert.evaluation.threshold'?: string | number | null;
};
