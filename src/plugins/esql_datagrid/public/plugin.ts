/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Plugin, CoreStart, CoreSetup } from '@kbn/core/public';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { UiActionsStart } from '@kbn/ui-actions-plugin/public';
import type { FieldFormatsStart } from '@kbn/field-formats-plugin/public';
import type { SharePluginStart } from '@kbn/share-plugin/public';
import { setKibanaServices } from './kibana_services';

interface ESQLDataGridPluginStart {
  data: DataPublicPluginStart;
  uiActions: UiActionsStart;
  fieldFormats: FieldFormatsStart;
  share?: SharePluginStart;
}
export class ESQLDataGridPlugin implements Plugin<{}, void> {
  public setup(_: CoreSetup, {}: {}) {
    return {};
  }

  public start(
    core: CoreStart,
    { data, uiActions, fieldFormats, share }: ESQLDataGridPluginStart
  ): void {
    setKibanaServices(core, data, uiActions, fieldFormats, share);
  }

  public stop() {}
}
