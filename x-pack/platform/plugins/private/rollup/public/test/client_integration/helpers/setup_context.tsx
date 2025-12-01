/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { coreMock } from '@kbn/core/public/mocks';

const startMock = coreMock.createStart();

const services = {
  setBreadcrumbs: startMock.chrome.setBreadcrumbs,
};

export const WithAppDependencies =
  (Component: React.ComponentType<any>) => (props: Record<string, unknown>) => {
    return (
      <KibanaContextProvider services={services}>
        <Component {...props} />
      </KibanaContextProvider>
    );
  };
