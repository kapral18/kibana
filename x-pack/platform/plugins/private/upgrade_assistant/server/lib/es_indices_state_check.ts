/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ElasticsearchClient } from '@kbn/core/server';
import { getIndexState } from '../../common/get_index_state';
import { ResolveIndexResponseFromES } from '../../common/types';

type StatusCheckResult = Record<string, 'open' | 'closed'>;

export const esIndicesStateCheck = async (
  esClient: ElasticsearchClient,
  indices: string[]
): Promise<StatusCheckResult> => {
  const response = await esClient.indices.resolveIndex({
    name: '*',
    expand_wildcards: 'all',
  });

  return indices.reduce<StatusCheckResult>((acc, index) => {
    acc[index] = getIndexState(index, response as ResolveIndexResponseFromES);
    return acc;
  }, {});
};
