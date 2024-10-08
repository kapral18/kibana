/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Capabilities } from '@kbn/core/public';
import type { DataViewsContract } from '@kbn/data-plugin/public';
import type { DataView } from '@kbn/data-views-plugin/public';

async function popularizeField(
  dataView: DataView,
  fieldName: string,
  DataViewsService: DataViewsContract,
  capabilities: Capabilities
) {
  if (!dataView.id || !capabilities?.indexPatterns?.save) return;
  const field = dataView.fields.getByName(fieldName);
  if (!field) {
    return;
  }

  dataView.setFieldCount(fieldName, field.count + 1);

  if (!dataView.isPersisted()) {
    return;
  }

  // Catch 409 errors caused by user adding columns in a higher frequency that the changes can be persisted to Elasticsearch
  try {
    await DataViewsService.updateSavedObject(dataView, 0, true);
    // eslint-disable-next-line no-empty
  } catch {}
}

export { popularizeField };
