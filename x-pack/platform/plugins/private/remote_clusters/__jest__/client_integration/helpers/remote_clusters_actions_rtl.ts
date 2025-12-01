/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export interface RemoteClustersActions {
  docsButtonExists: () => boolean;
  pageTitle: {
    exists: () => boolean;
    text: () => string;
  };
  formStep: {
    nameInput: {
      setValue: (name: string) => Promise<void>;
      getValue: () => string;
      isDisabled: () => boolean;
    };
    skipUnavailableSwitch: {
      exists: () => boolean;
      toggle: () => Promise<void>;
      isChecked: () => boolean;
    };
    connectionModeSwitch: {
      exists: () => boolean;
      toggle: () => Promise<void>;
      isChecked: () => boolean;
    };
    cloudAdvancedOptionsSwitch: {
      toggle: () => Promise<void>;
      exists: () => boolean;
      isChecked: () => boolean;
    };
    cloudRemoteAddressInput: {
      exists: () => boolean;
      getValue: () => string;
      setValue: (remoteAddress: string) => Promise<void>;
    };
    seedsInput: {
      setValue: (seed: string) => Promise<void>;
      getValue: () => string;
    };
    nodeConnectionsInput: {
      setValue: (connections: string) => Promise<void>;
    };
    proxyAddressInput: {
      setValue: (proxyAddress: string) => Promise<void>;
      exists: () => boolean;
    };
    serverNameInput: {
      getLabel: () => string;
      exists: () => boolean;
    };
    tlsServerNameInput: {
      getLabel: () => string;
      exists: () => boolean;
    };
    button: {
      click: () => Promise<void>;
      isDisabled: () => boolean;
    };
    backButton: {
      click: () => Promise<void>;
    };
    isOnFormStep: () => boolean;
  };

  setupTrustStep: {
    apiCardExist: () => boolean;
    certCardExist: () => boolean;
    selectApiKeyTrustMode: () => Promise<void>;
    selectCertificatesTrustMode: () => Promise<void>;
    button: {
      click: () => Promise<void>;
      isDisabled: () => boolean;
    };
    isOnTrustStep: () => boolean;
  };

  reviewStep: {
    onPrem: {
      exists: () => boolean;
      step1LinkExists: () => boolean;
      step2LinkExists: () => boolean;
      step1Link: () => string;
      step2Link: () => string;
    };
    cloud: {
      apiKeyDocumentationExists: () => boolean;
      certDocumentationExists: () => boolean;
    };
    clickAddCluster: () => Promise<void>;
    errorBannerExists: () => boolean;
    backButton: {
      click: () => Promise<void>;
    };
  };

  getErrorMessages: () => string[];
  globalErrorExists: () => boolean;
}

export const createRemoteClustersActions = (user: UserEvent): RemoteClustersActions => {
  const exists = (testId: string) => screen.queryByTestId(testId) !== null;
  const getElement = (testId: string) => screen.getByTestId(testId);

  const docsButtonExists = () => exists('remoteClusterDocsButton');

  const createPageTitleActions = () => {
    const pageTitleSelector = 'remoteClusterPageTitle';
    return {
      pageTitle: {
        exists: () => exists(pageTitleSelector),
        text: () => getElement(pageTitleSelector).textContent || '',
      },
    };
  };

  const formStepActions = () => {
    const createNameInputActions = () => {
      const nameInputSelector = 'remoteClusterFormNameInput';
      return {
        nameInput: {
          setValue: async (name: string) => {
            const input = getElement(nameInputSelector) as HTMLInputElement;
            await user.clear(input);
            await user.type(input, name);
          },
          getValue: () => (getElement(nameInputSelector) as HTMLInputElement).value,
          isDisabled: () => (getElement(nameInputSelector) as HTMLInputElement).disabled,
        },
      };
    };

    const createSkipUnavailableActions = () => {
      const skipUnavailableToggleSelector = 'remoteClusterFormSkipUnavailableFormToggle';
      return {
        skipUnavailableSwitch: {
          exists: () => exists(skipUnavailableToggleSelector),
          toggle: async () => {
            await user.click(getElement(skipUnavailableToggleSelector));
          },
          isChecked: () => getElement(skipUnavailableToggleSelector).getAttribute('aria-checked') === 'true',
        },
      };
    };

    const createConnectionModeActions = () => {
      const connectionModeToggleSelector = 'remoteClusterFormConnectionModeToggle';
      return {
        connectionModeSwitch: {
          exists: () => exists(connectionModeToggleSelector),
          toggle: async () => {
            await user.click(getElement(connectionModeToggleSelector));
          },
          isChecked: () => getElement(connectionModeToggleSelector).getAttribute('aria-checked') === 'true',
        },
      };
    };

    const createCloudAdvancedOptionsSwitchActions = () => {
      const cloudUrlSelector = 'remoteClusterFormCloudAdvancedOptionsToggle';
      return {
        cloudAdvancedOptionsSwitch: {
          exists: () => exists(cloudUrlSelector),
          toggle: async () => {
            await user.click(getElement(cloudUrlSelector));
          },
          isChecked: () => getElement(cloudUrlSelector).getAttribute('aria-checked') === 'true',
        },
      };
    };

    const createSeedsInputActions = () => {
      const seedsInputSelector = 'remoteClusterFormSeedsInput';
      return {
        seedsInput: {
          setValue: async (seed: string) => {
            const input = screen.getByRole('combobox', { name: /seed nodes/i });
            await user.type(input, seed);
            await user.keyboard('{Enter}');
          },
          getValue: () => getElement(seedsInputSelector).textContent || '',
        },
      };
    };

    const createNodeConnectionsInputActions = () => {
      const nodeConnectionsInputSelector = 'remoteClusterFormNodeConnectionsInput';
      return {
        nodeConnectionsInput: {
          setValue: async (connections: string) => {
            const input = getElement(nodeConnectionsInputSelector) as HTMLInputElement;
            await user.clear(input);
            await user.type(input, connections);
          },
        },
      };
    };

    const createProxyAddressActions = () => {
      const proxyAddressSelector = 'remoteClusterFormProxyAddressInput';
      return {
        proxyAddressInput: {
          setValue: async (proxyAddress: string) => {
            const input = getElement(proxyAddressSelector) as HTMLInputElement;
            await user.clear(input);
            await user.type(input, proxyAddress);
          },
          exists: () => exists(proxyAddressSelector),
        },
      };
    };

    const formButtonsActions = () => {
      const formButtonSelector = 'remoteClusterFormNextButton';
      return {
        button: {
          click: async () => {
            await user.click(getElement(formButtonSelector));
          },
          isDisabled: () => (getElement(formButtonSelector) as HTMLButtonElement).disabled,
        },
      };
    };

    const formBackButtonActions = () => {
      return {
        backButton: {
          click: async () => {
            await user.click(getElement('remoteClusterFormBackButton'));
          },
        },
      };
    };

    const isOnFormStepActions = () => {
      return { isOnFormStep: () => exists('remoteClusterFormNextButton') };
    };

    const createServerNameActions = () => {
      const serverNameSelector = 'remoteClusterFormServerNameFormRow';
      return {
        serverNameInput: {
          getLabel: () => {
            const formRow = getElement(serverNameSelector);
            const label = formRow.querySelector('label');
            return label?.textContent || '';
          },
          exists: () => exists(serverNameSelector),
        },
      };
    };

    const createTlsServerNameActions = () => {
      const serverNameSelector = 'remoteClusterFormTLSServerNameFormRow';
      return {
        tlsServerNameInput: {
          getLabel: () => {
            const formRow = getElement(serverNameSelector);
            const label = formRow.querySelector('label');
            return label?.textContent || '';
          },
          exists: () => exists(serverNameSelector),
        },
      };
    };

    const createCloudRemoteAddressInputActions = () => {
      const cloudUrlInputSelector = 'remoteClusterFormRemoteAddressInput';
      return {
        cloudRemoteAddressInput: {
          exists: () => exists(cloudUrlInputSelector),
          getValue: () => (getElement(cloudUrlInputSelector) as HTMLInputElement).value,
          setValue: async (remoteAddress: string) => {
            const input = getElement(cloudUrlInputSelector) as HTMLInputElement;
            await user.clear(input);
            await user.type(input, remoteAddress);
          },
        },
      };
    };

    return {
      formStep: {
        ...createNameInputActions(),
        ...createSkipUnavailableActions(),
        ...createConnectionModeActions(),
        ...createCloudAdvancedOptionsSwitchActions(),
        ...createSeedsInputActions(),
        ...createNodeConnectionsInputActions(),
        ...createProxyAddressActions(),
        ...formButtonsActions(),
        ...formBackButtonActions(),
        ...isOnFormStepActions(),
        ...createServerNameActions(),
        ...createTlsServerNameActions(),
        ...createCloudRemoteAddressInputActions(),
      },
    };
  };

  const globalErrorExists = () => exists('remoteClusterFormGlobalError');

  const setupTrustStepActions = () => {
    const trustButtonSelector = 'remoteClusterTrustNextButton';
    return {
      setupTrustStep: {
        apiCardExist: () => exists('setupTrustApiMode'),
        certCardExist: () => exists('setupTrustCertMode'),
        selectApiKeyTrustMode: async () => {
          await user.click(getElement('setupTrustApiMode'));
        },
        selectCertificatesTrustMode: async () => {
          await user.click(getElement('setupTrustCertMode'));
        },
        button: {
          click: async () => {
            await user.click(getElement(trustButtonSelector));
          },
          isDisabled: () => (getElement(trustButtonSelector) as HTMLButtonElement).disabled,
        },
        isOnTrustStep: () => exists(trustButtonSelector),
      },
    };
  };

  const reviewStepActions = () => {
    const onPremReviewStepsSelector = 'remoteClusterReviewOnPremSteps';
    const onPremStep1Selector = 'remoteClusterReviewOnPremStep1';
    const onPremStep2Selector = 'remoteClusterReviewOnPremStep2';
    return {
      reviewStep: {
        onPrem: {
          exists: () => exists(onPremReviewStepsSelector),
          step1LinkExists: () => exists(onPremStep1Selector),
          step2LinkExists: () => exists(onPremStep2Selector),
          step1Link: () => getElement(onPremStep1Selector).getAttribute('href') || '',
          step2Link: () => getElement(onPremStep2Selector).getAttribute('href') || '',
        },
        cloud: {
          apiKeyDocumentationExists: () => exists('cloudApiKeySteps'),
          certDocumentationExists: () => exists('cloudCertDocumentation'),
        },
        clickAddCluster: async () => {
          await user.click(getElement('remoteClusterReviewtNextButton'));
        },
        errorBannerExists: () => exists('saveErrorBanner'),
        backButton: {
          click: async () => {
            await user.click(getElement('remoteClusterReviewtBackButton'));
          },
        },
      },
    };
  };

  const getErrorMessages = () => {
    const errorElements = screen.queryAllByRole('alert');
    return errorElements.map(el => el.textContent || '').filter(text => text.length > 0);
  };

  return {
    docsButtonExists,
    ...createPageTitleActions(),
    ...formStepActions(),
    ...setupTrustStepActions(),
    ...reviewStepActions(),
    getErrorMessages,
    globalErrorExists,
  };
};
