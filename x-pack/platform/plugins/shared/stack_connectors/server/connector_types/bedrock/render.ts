/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ExecutorParams } from '@kbn/actions-plugin/server/sub_action_framework/types';
import { renderMustacheString } from '@kbn/actions-plugin/server/lib/mustache_renderer';
import type { RenderParameterTemplates } from '@kbn/actions-plugin/server/types';
import { SUB_ACTION } from '../../../common/bedrock/constants';

export const renderParameterTemplates: RenderParameterTemplates<ExecutorParams> = (
  logger,
  params,
  variables
) => {
  if (params?.subAction !== SUB_ACTION.RUN && params?.subAction !== SUB_ACTION.TEST) return params;

  return {
    ...params,
    subActionParams: {
      ...params.subActionParams,
      body: renderMustacheString(logger, params.subActionParams.body as string, variables, 'json'),
    },
  };
};
