/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, Plugin } from '@kbn/core/server';

export class AuditTrailTestPlugin implements Plugin {
  public setup(core: CoreSetup) {
    const router = core.http.createRouter();
    router.get(
      {
        path: '/audit_log',
        security: {
          authz: {
            enabled: false,
            reason: 'This route is opted out from authorization',
          },
        },
        validate: false,
      },
      async (context, request, response) => {
        const soClient = (await context.core).savedObjects.client;
        await soClient.create('dashboard', {
          title: '',
          optionsJSON: '',
          description: '',
          panelsJSON: '{}',
          kibanaSavedObjectMeta: {},
        });
        await soClient.find({ type: 'dashboard' });
        return response.noContent();
      }
    );
  }

  public start() {}
}
