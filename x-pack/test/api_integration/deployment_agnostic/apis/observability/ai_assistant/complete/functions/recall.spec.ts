/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { first, uniq } from 'lodash';
import type { DeploymentAgnosticFtrProviderContext } from '../../../../../ftr_provider_context';
import {
  clearKnowledgeBase,
  deleteKnowledgeBaseModel,
  addSampleDocsToInternalKb,
  addSampleDocsToCustomIndex,
  setupKnowledgeBase,
} from '../../utils/knowledge_base';

const customSearchConnectorIndex = 'animals_kb';

const sampleDocsForInternalKb = [
  {
    id: 'technical_db_outage_slow_queries',
    title: 'Database Outage: Slow Query Execution',
    text: 'At 03:15 AM UTC, the production database experienced a significant outage, leading to slow query execution and increased response times across multiple services. A surge in database load was detected, with 90% of queries exceeding 2 seconds. A detailed log analysis pointed to locking issues within the transaction queue and inefficient index usage.',
  },
  {
    id: 'technical_api_gateway_timeouts',
    title: 'Service Timeout: API Gateway Bottleneck',
    text: 'At 10:45 AM UTC, the API Gateway encountered a timeout issue, causing a 500 error for all incoming requests. Detailed traces indicated a significant bottleneck at the gateway level, where requests stalled while waiting for upstream service responses. The upstream service was overwhelmed due to a sudden spike in inbound traffic and failed to release resources promptly.',
  },
  {
    id: 'technical_cache_misses_thirdparty_api',
    title: 'Cache Misses and Increased Latency: Third-Party API Failure',
    text: 'At 04:30 PM UTC, a dramatic increase in cache misses and latency was observed. The failure of a third-party API prevented critical data from being cached, leading to unnecessary re-fetching of resources from external sources. This caused significant delays in response times, with up to 10-second delays in some key services.',
  },
];

const sampleDocsForCustomIndex = [
  {
    id: 'animal_elephants_social_structure',
    title: 'Elephants and Their Social Structure',
    text: 'Elephants are highly social animals that live in matriarchal herds led by the oldest female. These animals communicate through low-frequency sounds, called infrasound, that travel long distances. They are known for their intelligence, strong memory, and deep emotional bonds with each other.',
  },
  {
    id: 'animal_cheetah_life_speed',
    title: 'The Life of a Cheetah',
    text: 'Cheetahs are the fastest land animals, capable of reaching speeds up to 60 miles per hour in short bursts. They rely on their speed to catch prey, such as gazelles. Unlike other big cats, cheetahs cannot roar, but they make distinctive chirping sounds, especially when communicating with their cubs.',
  },
  {
    id: 'animal_whale_migration_patterns',
    title: 'Whales and Their Migration Patterns',
    text: 'Whales are known for their long migration patterns, traveling thousands of miles between feeding and breeding grounds.',
  },
  {
    id: 'animal_giraffe_habitat_feeding',
    title: 'Giraffes: Habitat and Feeding Habits',
    text: 'Giraffes are the tallest land animals, with long necks that help them reach leaves high up in trees. They live in savannas and grasslands, where they feed on leaves, twigs, and fruits from acacia trees.',
  },
  {
    id: 'animal_penguin_antarctic_adaptations',
    title: 'Penguins and Their Antarctic Adaptations',
    text: 'Penguins are flightless birds that have adapted to life in the cold Antarctic environment. They have a thick layer of blubber to keep warm, and their wings have evolved into flippers for swimming in the icy waters.',
  },
];

export default function ApiTest({ getService }: DeploymentAgnosticFtrProviderContext) {
  const observabilityAIAssistantAPIClient = getService('observabilityAIAssistantApi');
  const es = getService('es');

  describe('recall', function () {
    before(async () => {
      await setupKnowledgeBase(getService);
      await addSampleDocsToInternalKb(getService, sampleDocsForInternalKb);
      await addSampleDocsToCustomIndex(
        getService,
        sampleDocsForCustomIndex,
        customSearchConnectorIndex
      );
    });

    after(async () => {
      await deleteKnowledgeBaseModel(getService);
      await clearKnowledgeBase(es);
      // clear custom index
      await es.indices.delete({ index: customSearchConnectorIndex }, { ignore: [404] });
    });

    describe('GET /internal/observability_ai_assistant/functions/recall', () => {
      it('produces unique scores for each doc', async () => {
        const entries = await recall('What happened during the database outage?');
        const uniqueScores = uniq(entries.map(({ esScore }) => esScore));
        expect(uniqueScores.length).to.be.greaterThan(1);
        expect(uniqueScores.length).to.be(8);
      });

      it('returns results from both search connectors and internal kb', async () => {
        const entries = await recall('What happened during the database outage?');
        const docTypes = uniq(entries.map(({ id }) => id.split('_')[0]));
        expect(docTypes).to.eql(['animal', 'technical']);
      });

      it('returns entries in a consistent order', async () => {
        const entries = await recall('whales');

        expect(entries.map(({ id, esScore }) => `${formatScore(esScore!)} - ${id}`)).to.eql([
          'high - animal_whale_migration_patterns',
          'low - animal_elephants_social_structure',
          'low - technical_api_gateway_timeouts',
          'low - technical_cache_misses_thirdparty_api',
          'low - animal_cheetah_life_speed',
          'low - technical_db_outage_slow_queries',
          'low - animal_giraffe_habitat_feeding',
          'low - animal_penguin_antarctic_adaptations',
        ]);
      });

      it('returns the "Cheetah" entry from search connectors as the top result', async () => {
        const entries = await recall('Cheetah');
        const { text, esScore } = first(entries)!;

        // search connector entries have their entire doc stringified in `text` field
        const parsedDoc = JSON.parse(text) as { title: string; text: string };
        expect(parsedDoc.title).to.eql('The Life of a Cheetah');
        expect(esScore).to.greaterThan(0.1);
      });

      it('returns different result order for different queries', async () => {
        const databasePromptEntries = await recall('What happened during the database outage?');
        const animalPromptEntries = await recall('Do you have knowledge about animals?');

        expect(databasePromptEntries.length).to.be(8);
        expect(animalPromptEntries.length).to.be(8);

        expect(databasePromptEntries.map(({ id }) => id)).not.to.eql(
          animalPromptEntries.map(({ id }) => id)
        );
      });
    });
  });

  async function recall(prompt: string) {
    const { body, status } = await observabilityAIAssistantAPIClient.editor({
      endpoint: 'POST /internal/observability_ai_assistant/functions/recall',
      params: {
        body: {
          queries: [{ text: prompt }],
        },
      },
    });

    expect(status).to.be(200);

    return body.entries;
  }
}

function formatScore(score: number) {
  if (score > 0.5) {
    return 'high';
  }

  if (score > 0.1) {
    return 'medium';
  }

  return 'low';
}
