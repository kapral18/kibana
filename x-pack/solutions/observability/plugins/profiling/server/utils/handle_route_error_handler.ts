/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KibanaResponseFactory } from '@kbn/core-http-server';
import type { Logger } from '@kbn/logging';
import { WrappedElasticsearchClientError } from '@kbn/observability-plugin/server';
import { errors } from '@elastic/elasticsearch';

export function handleRouteHandlerError({
  error,
  logger,
  response,
  message,
}: {
  error: any;
  response: KibanaResponseFactory;
  logger: Logger;
  message: string;
}) {
  if (
    error instanceof WrappedElasticsearchClientError &&
    error.originalError instanceof errors.RequestAbortedError
  ) {
    return response.custom({
      statusCode: 499,
      body: {
        message: 'Client closed request',
      },
    });
  }
  logger.error(error);

  return response.customError({
    statusCode: error.statusCode ?? 500,
    body: { message },
  });
}
