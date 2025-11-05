/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, within } from '@testing-library/react';
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
  const docsButtonExists = () => {
    return screen.queryByTestId('remoteClusterDocsButton') !== null;
  };

  const createPageTitleActions = () => {
    const pageTitleSelector = 'remoteClusterPageTitle';
    return {
      pageTitle: {
        exists: () => screen.queryByTestId(pageTitleSelector) !== null,
        text: () => screen.getByTestId(pageTitleSelector).textContent || '',
      },
    };
  };

  const formStepActions = () => {
    const createNameInputActions = () => {
      const nameInputSelector = 'remoteClusterFormNameInput';
      return {
        nameInput: {
          setValue: async (name: string) => {
            const input = screen.getByTestId(nameInputSelector);
            await user.clear(input);
            await user.type(input, name);
          },
          getValue: () => {
            const input = screen.getByTestId(nameInputSelector) as HTMLInputElement;
            return input.value;
          },
          isDisabled: () => {
            const input = screen.getByTestId(nameInputSelector) as HTMLInputElement;
            return input.disabled;
          },
        },
      };
    };

    const createSkipUnavailableActions = () => {
      const skipUnavailableToggleSelector = 'remoteClusterFormSkipUnavailableFormToggle';
      return {
        skipUnavailableSwitch: {
          exists: () => screen.queryByTestId(skipUnavailableToggleSelector) !== null,
          toggle: async () => {
            const toggle = screen.getByTestId(skipUnavailableToggleSelector);
            await user.click(toggle);
          },
          isChecked: () => {
            const toggle = screen.getByTestId(skipUnavailableToggleSelector);
            return toggle.getAttribute('aria-checked') === 'true';
          },
        },
      };
    };

    const createConnectionModeActions = () => {
      const connectionModeToggleSelector = 'remoteClusterFormConnectionModeToggle';
      return {
        connectionModeSwitch: {
          exists: () => screen.queryByTestId(connectionModeToggleSelector) !== null,
          toggle: async () => {
            const toggle = screen.getByTestId(connectionModeToggleSelector);
            await user.click(toggle);
          },
          isChecked: () => {
            const toggle = screen.getByTestId(connectionModeToggleSelector);
            return toggle.getAttribute('aria-checked') === 'true';
          },
        },
      };
    };

    const createCloudAdvancedOptionsSwitchActions = () => {
      const cloudUrlSelector = 'remoteClusterFormCloudAdvancedOptionsToggle';
      return {
        cloudAdvancedOptionsSwitch: {
          exists: () => screen.queryByTestId(cloudUrlSelector) !== null,
          toggle: async () => {
            const toggle = screen.getByTestId(cloudUrlSelector);
            await user.click(toggle);
          },
          isChecked: () => {
            const toggle = screen.getByTestId(cloudUrlSelector);
            return toggle.getAttribute('aria-checked') === 'true';
          },
        },
      };
    };

    const createSeedsInputActions = () => {
      const seedsInputSelector = 'remoteClusterFormSeedsInput';
      return {
        seedsInput: {
          setValue: async (seed: string) => {
            const input = screen.getByTestId(seedsInputSelector);
            await user.clear(input);
            await user.type(input, seed);
            // Simulate pressing Enter to add the seed
            await user.keyboard('{Enter}');
          },
          getValue: () => {
            const comboBox = screen.getByTestId(seedsInputSelector);
            return comboBox.textContent || '';
          },
        },
      };
    };

    const createNodeConnectionsInputActions = () => {
      const nodeConnectionsInputSelector = 'remoteClusterFormNodeConnectionsInput';
      return {
        nodeConnectionsInput: {
          setValue: async (connections: string) => {
            const input = screen.getByTestId(nodeConnectionsInputSelector);
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
            const input = screen.getByTestId(proxyAddressSelector);
            await user.clear(input);
            await user.type(input, proxyAddress);
          },
          exists: () => screen.queryByTestId(proxyAddressSelector) !== null,
        },
      };
    };

    const formButtonsActions = () => {
      const formButtonSelector = 'remoteClusterFormNextButton';
      return {
        button: {
          click: async () => {
            const button = screen.getByTestId(formButtonSelector);
            await user.click(button);
          },
          isDisabled: () => {
            const button = screen.getByTestId(formButtonSelector) as HTMLButtonElement;
            return button.disabled;
          },
        },
      };
    };

    const formBackButtonActions = () => {
      return {
        backButton: {
          click: async () => {
            const button = screen.getByTestId('remoteClusterFormBackButton');
            await user.click(button);
          },
        },
      };
    };

    const isOnFormStepActions = () => {
      return {
        isOnFormStep: () => screen.queryByTestId('remoteClusterFormNextButton') !== null,
      };
    };

    const createServerNameActions = () => {
      const serverNameSelector = 'remoteClusterFormServerNameFormRow';
      return {
        serverNameInput: {
          getLabel: () => {
            const formRow = screen.getByTestId(serverNameSelector);
            const label = within(formRow).getByText(/Server name/i);
            return label.textContent || '';
          },
          exists: () => screen.queryByTestId(serverNameSelector) !== null,
        },
      };
    };

    const createTlsServerNameActions = () => {
      const serverNameSelector = 'remoteClusterFormTLSServerNameFormRow';
      return {
        tlsServerNameInput: {
          getLabel: () => {
            const formRow = screen.getByTestId(serverNameSelector);
            const label = within(formRow).getByText(/TLS server name/i);
            return label.textContent || '';
          },
          exists: () => screen.queryByTestId(serverNameSelector) !== null,
        },
      };
    };

    const createCloudRemoteAddressInputActions = () => {
      const cloudUrlInputSelector = 'remoteClusterFormRemoteAddressInput';
      return {
        cloudRemoteAddressInput: {
          exists: () => screen.queryByTestId(cloudUrlInputSelector) !== null,
          getValue: () => {
            const input = screen.getByTestId(cloudUrlInputSelector) as HTMLInputElement;
            return input.value;
          },
          setValue: async (remoteAddress: string) => {
            const input = screen.getByTestId(cloudUrlInputSelector);
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

  const globalErrorExists = () => screen.queryByTestId('remoteClusterFormGlobalError') !== null;

  const getErrorMessages = () => {
    const errorElements = screen.queryAllByText(/is required|Remove the character|Spaces are not allowed/i);
    return errorElements.map((el) => el.textContent || '');
  };

  const setupTrustStepActions = () => {
    const trustButtonSelector = 'remoteClusterTrustNextButton';
    return {
      setupTrustStep: {
        apiCardExist: () => screen.queryByTestId('setupTrustApiMode') !== null,
        certCardExist: () => screen.queryByTestId('setupTrustCertMode') !== null,
        selectApiKeyTrustMode: async () => {
          const apiCard = screen.getByTestId('setupTrustApiMode');
          await user.click(apiCard);
        },
        selectCertificatesTrustMode: async () => {
          const certCard = screen.getByTestId('setupTrustCertMode');
          await user.click(certCard);
        },
        button: {
          click: async () => {
            const button = screen.getByTestId(trustButtonSelector);
            await user.click(button);
          },
          isDisabled: () => {
            const button = screen.getByTestId(trustButtonSelector) as HTMLButtonElement;
            return button.disabled;
          },
        },
        isOnTrustStep: () => screen.queryByTestId(trustButtonSelector) !== null,
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
          exists: () => screen.queryByTestId(onPremReviewStepsSelector) !== null,
          step1LinkExists: () => screen.queryByTestId(onPremStep1Selector) !== null,
          step2LinkExists: () => screen.queryByTestId(onPremStep2Selector) !== null,
          step1Link: () => {
            const link = screen.getByTestId(onPremStep1Selector) as HTMLAnchorElement;
            return link.href;
          },
          step2Link: () => {
            const link = screen.getByTestId(onPremStep2Selector) as HTMLAnchorElement;
            return link.href;
          },
        },
        cloud: {
          apiKeyDocumentationExists: () => screen.queryByTestId('cloudApiKeySteps') !== null,
          certDocumentationExists: () => screen.queryByTestId('cloudCertDocumentation') !== null,
        },
        clickAddCluster: async () => {
          const button = screen.getByTestId('remoteClusterReviewtNextButton');
          await user.click(button);
        },
        errorBannerExists: () => screen.queryByTestId('saveErrorBanner') !== null,
        backButton: {
          click: async () => {
            const button = screen.getByTestId('remoteClusterReviewtBackButton');
            await user.click(button);
          },
        },
      },
    };
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
