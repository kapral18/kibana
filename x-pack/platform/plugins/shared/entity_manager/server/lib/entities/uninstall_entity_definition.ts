/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ElasticsearchClient } from '@kbn/core-elasticsearch-server';
import { SavedObjectsClientContract } from '@kbn/core-saved-objects-api-server';
import { EntityDefinition } from '@kbn/entities-schema';
import { Logger } from '@kbn/logging';
import { deleteEntityDefinition } from './delete_entity_definition';
import { deleteIngestPipelines } from './delete_ingest_pipeline';

import { deleteTemplates } from '../manage_index_templates';

import { stopTransforms } from './stop_transforms';

import { deleteTransforms } from './delete_transforms';
import { EntityClient } from '../entity_client';
import { EntityManagerServerSetup } from '../../types';
import { deleteEntityDiscoveryAPIKey, readEntityDiscoveryAPIKey } from '../auth';
import { getClientsFromAPIKey } from '../utils';

export async function uninstallEntityDefinition({
  definition,
  esClient,
  soClient,
  logger,
}: {
  definition: EntityDefinition;
  esClient: ElasticsearchClient;
  soClient: SavedObjectsClientContract;
  logger: Logger;
}) {
  await stopTransforms(esClient, definition, logger);
  await deleteTransforms(esClient, definition, logger);

  await deleteIngestPipelines(esClient, definition, logger);

  await deleteTemplates(esClient, definition, logger);

  await deleteEntityDefinition(soClient, definition);
}

export async function uninstallBuiltInEntityDefinitions({
  entityClient,
  deleteData = false,
}: {
  entityClient: EntityClient;
  deleteData?: boolean;
}): Promise<EntityDefinition[]> {
  const { definitions } = await entityClient.getEntityDefinitions({
    builtIn: true,
    perPage: 1000,
  });

  await Promise.allSettled(
    definitions.map(async ({ id }) => {
      await entityClient.deleteEntityDefinition({ id, deleteData });
    })
  );

  return definitions;
}

export async function disableManagedEntityDiscovery({
  server,
}: {
  server: EntityManagerServerSetup;
}) {
  const apiKey = await readEntityDiscoveryAPIKey(server);
  if (!apiKey) {
    return;
  }

  const { clusterClient, soClient } = getClientsFromAPIKey({ apiKey, server });
  const entityClient = new EntityClient({ clusterClient, soClient, logger: server.logger });

  await uninstallBuiltInEntityDefinitions({ entityClient, deleteData: true });

  await deleteEntityDiscoveryAPIKey(soClient);
  await server.security.authc.apiKeys.invalidateAsInternalUser({
    ids: [apiKey.id],
  });
}
