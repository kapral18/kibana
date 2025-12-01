/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RepositoryType } from '../../common/types';
import { getRandomString } from '../../__jest__/client_integration/helpers/random';
const defaultSettings: any = { chunkSize: '10mb', location: '/tmp/es-backups' };

export interface Repository {
  name: string;
  type: RepositoryType;
  settings: any;
}

export const getRepository = ({
  name = getRandomString(),
  type = 'fs' as 'fs',
  settings = defaultSettings,
}: Partial<Repository> = {}): Repository => ({
  name,
  type,
  settings,
});
