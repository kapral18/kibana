/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import type { estypes } from '@elastic/elasticsearch';

import { RouteDependencies } from '../../../types';
import { addBasePath } from '..';
import { componentTemplateSchema } from './schema_validation';

const paramsSchema = schema.object({
  name: schema.string(),
});

export const registerUpdateRoute = ({
  router,
  lib: { handleEsError },
}: RouteDependencies): void => {
  router.put(
    {
      path: addBasePath('/component_templates/{name}'),
      security: {
        authz: {
          enabled: false,
          reason: 'Relies on es client for authorization',
        },
      },
      validate: {
        body: componentTemplateSchema,
        params: paramsSchema,
      },
    },
    async (context, request, response) => {
      const { client } = (await context.core).elasticsearch;
      const { name } = request.params;
      const { template, version, _meta, deprecated } = request.body;

      try {
        // Verify component exists; ES will throw 404 if not
        await client.asCurrentUser.cluster.getComponentTemplate({ name });

        const responseBody = await client.asCurrentUser.cluster.putComponentTemplate({
          name,
          template: template as estypes.IndicesIndexState,
          version,
          _meta,
          deprecated,
        });

        return response.ok({ body: responseBody });
      } catch (error) {
        return handleEsError({ error, response });
      }
    }
  );
};
