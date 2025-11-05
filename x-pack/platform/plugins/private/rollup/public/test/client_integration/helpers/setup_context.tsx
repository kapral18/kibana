/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FunctionComponent } from 'react';
import React from 'react';
import type { ReactElement } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { I18nProvider } from '@kbn/i18n-react';
import { coreMock } from '@kbn/core/public/mocks';

const startMock = coreMock.createStart();

const services = {
  setBreadcrumbs: startMock.chrome.setBreadcrumbs,
};

const wrapComponent = (Component: FunctionComponent) => (props: any) =>
  (
    <KibanaContextProvider services={services}>
      <I18nProvider>
        <Component {...props} />
      </I18nProvider>
    </KibanaContextProvider>
  );

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<React.PropsWithChildren<{}>>;
}

const renderWithProviders = (
  ui: ReactElement,
  renderOptions?: RenderWithProvidersOptions
) => {
  const { wrapper: CustomWrapper, ...options } = renderOptions || {};

  const Wrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    return (
      <KibanaContextProvider services={services}>
        <I18nProvider>
          {CustomWrapper ? <CustomWrapper>{children}</CustomWrapper> : children}
        </I18nProvider>
      </KibanaContextProvider>
    );
  };

  const user = userEvent.setup({ 
    advanceTimers: jest.advanceTimersByTime,
    pointerEventsCheck: 0 
  });

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};

export { wrapComponent, renderWithProviders };
