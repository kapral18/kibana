/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { MAIN_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import type { ProvidedType } from '@kbn/test';

import type { EsArchiverProvider } from '../es_archiver';
import type { RetryService } from '../retry';
import type { KibanaServerProvider } from './kibana_server';

const ES_ARCHIVER_LOAD_METHODS = ['load', 'loadIfNeeded', 'unload', 'emptyKibanaIndex'] as const;

interface Options {
  esArchiver: ProvidedType<typeof EsArchiverProvider>;
  kibanaServer: ProvidedType<typeof KibanaServerProvider>;
  retry: RetryService;
  defaults: Record<string, any>;
}

export function extendEsArchiver({ esArchiver, kibanaServer, retry, defaults }: Options) {
  // only extend the esArchiver if there are default uiSettings to restore
  if (!defaults) {
    return;
  }

  ES_ARCHIVER_LOAD_METHODS.forEach((method) => {
    const originalMethod = esArchiver[method];

    esArchiver[method] = async (...args: unknown[]) => {
      // esArchiver methods return a stats object, with information about the indexes created
      const stats = await originalMethod.apply(esArchiver, args as any);

      const statsKeys = Object.keys(stats);
      const kibanaKeys = statsKeys.filter(
        // this also matches stats keys like '.kibana_1' and '.kibana_2,.kibana_1'
        (key) => key.includes(MAIN_SAVED_OBJECT_INDEX) && stats[key].created
      );

      // if the kibana index was created by the esArchiver then update the uiSettings
      // with the defaults to make sure that they are always in place initially
      if (kibanaKeys.length > 0) {
        await retry.try(async () => {
          await kibanaServer.uiSettings.update(defaults);
        });
      }

      return stats;
    };
  });
}
