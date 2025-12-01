/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import type { TrainedModelsDeploymentModalProps } from '../../../public/application/sections/home/index_list/details_page/trained_models_deployment_modal';
import { TrainedModelsDeploymentModal } from '../../../public/application/sections/home/index_list/details_page/trained_models_deployment_modal';
import * as mappingsContext from '../../../public/application/components/mappings_editor/mappings_state_context';
import type { NormalizedField } from '../../../public/application/components/mappings_editor/types';

jest.mock('../../../public/hooks/use_ml_model_status_toasts', () => ({
  useMLModelNotificationToasts: jest.fn().mockReturnValue({
    showErrorToasts: jest.fn(),
  }),
}));

jest.mock('../../../public/application/app_context', () => ({
  useAppContext: jest.fn().mockReturnValue({
    url: undefined,
    plugins: {
      ml: {
        mlApi: {
          trainedModels: {
            getModelsDownloadStatus: jest.fn().mockResolvedValue({}),
            getTrainedModels: jest.fn().mockResolvedValue([
              {
                model_id: '.elser_model_2',
                model_type: 'pytorch',
                model_package: {
                  packaged_model_id: 'elser_model_2',
                  model_repository: 'https://ml-models.elastic.co',
                  minimum_version: '11.0.0',
                  size: 438123914,
                  sha256: '',
                  metadata: {},
                  tags: [],
                  vocabulary_file: 'elser_model_2.vocab.json',
                },
                description: 'Elastic Learned Sparse EncodeR v2',
                tags: ['elastic'],
              },
            ]),
            getTrainedModelStats: jest.fn().mockResolvedValue({
              count: 1,
              trained_model_stats: [
                {
                  model_id: '.elser_model_2',

                  deployment_stats: {
                    deployment_id: 'elser_model_2',
                    model_id: '.elser_model_2',
                    threads_per_allocation: 1,
                    number_of_allocations: 1,
                    queue_capacity: 1024,
                    state: 'started',
                  },
                },
              ],
            }),
          },
        },
      },
    },
  }),
}));

jest.mock('../../../public/application/components/mappings_editor/mappings_state_context');

const mappingsContextMocked = jest.mocked(mappingsContext);

const defaultState = {
  inferenceToModelIdMap: {
    e5: {
      isDeployed: false,
      isDeployable: true,
      trainedModelId: '.multilingual-e5-small',
    },
    elser_model_2: {
      isDeployed: false,
      isDeployable: true,
      trainedModelId: '.elser_model_2',
    },
    openai: {
      isDeployed: false,
      isDeployable: false,
      trainedModelId: '',
    },
    my_elser_endpoint: {
      isDeployed: false,
      isDeployable: true,
      trainedModelId: '.elser_model_2',
    },
  },
  fields: {
    aliases: {},
    byId: {},
    rootLevelFields: [],
    maxNestedDepth: 0,
  },
  mappingViewFields: { byId: {} },
} as any;

const setErrorsInTrainedModelDeployment = jest.fn().mockReturnValue(undefined);
const saveMappings = jest.fn().mockReturnValue(undefined);
const forceSaveMappings = jest.fn().mockReturnValue(undefined);

describe('When semantic_text is enabled', () => {
  const renderComponent = (defaultProps: Partial<TrainedModelsDeploymentModalProps>) => {
    return renderWithI18n(<TrainedModelsDeploymentModal {...(defaultProps as any)} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('When there are no pending deployments and no errors in the model deployment', () => {
    beforeEach(() => {
      mappingsContextMocked.useMappingsState.mockReturnValue(defaultState);
      renderComponent({
        errorsInTrainedModelDeployment: {},
        saveMappings,
        forceSaveMappings,
        setErrorsInTrainedModelDeployment: () => undefined,
      });
    });

    it('should not display the modal', () => {
      expect(screen.queryByTestId('trainedModelsDeploymentModal')).not.toBeInTheDocument();
    });
  });

  describe('When there are pending deployments in the model deployment', () => {
    beforeEach(() => {
      mappingsContextMocked.useMappingsState.mockReturnValue({
        ...defaultState,
        fields: {
          ...defaultState.fields,
          byId: {
            new_field: {
              id: 'new_field',
              isMultiField: false,
              path: ['new_field'],
              source: {
                name: 'new_field',
                type: 'semantic_text',
                reference_field: 'title',
                inference_id: 'elser_model_2',
              },
            } as NormalizedField,
          },
          rootLevelFields: ['new_field'],
        },
      } as any);
      renderComponent({
        errorsInTrainedModelDeployment: {},
        forceSaveMappings,
        saveMappings,
        setErrorsInTrainedModelDeployment,
      });
    });

    it('should display the modal', () => {
      expect(screen.getByTestId('trainedModelsDeploymentModal')).toBeInTheDocument();
    });

    it('should contain content related to semantic_text', () => {
      const modalText = screen.getByTestId('trainedModelsDeploymentModalText');
      expect(modalText).toHaveTextContent('Some fields are referencing models');
    });

    it('should call saveMappings if refresh button is pressed', () => {
      const tryAgainButton = screen.getByTestId('tryAgainModalButton');
      fireEvent.click(tryAgainButton);
      expect(saveMappings).toHaveBeenCalledTimes(1);
    });

    it('should disable the force save mappings button if checkbox is not checked', () => {
      const forceSaveButton = screen.getByTestId('forceSaveMappingsButton');
      expect(forceSaveButton).toBeDisabled();
    });

    it('checking checkbox should enable force save mappings button', () => {
      const checkbox = screen.getByTestId('allowForceSaveMappingsCheckbox');
      fireEvent.click(checkbox);

      const forceSaveButton = screen.getByTestId('forceSaveMappingsButton');
      expect(forceSaveButton).not.toBeDisabled();

      fireEvent.click(forceSaveButton);
      expect(forceSaveMappings).toHaveBeenCalledTimes(1);
    });
  });

  describe('When there is error in the model deployment', () => {
    beforeEach(() => {
      mappingsContextMocked.useMappingsState.mockReturnValue({
        ...defaultState,
        fields: {
          ...defaultState.fields,
          byId: {
            new_field: {
              id: 'new_field',
              isMultiField: false,
              path: ['new_field'],
              source: {
                name: 'new_field',
                type: 'semantic_text',
                reference_field: 'title',
                inference_id: 'elser_model_2',
              },
            } as NormalizedField,
          },
          rootLevelFields: ['new_field'],
        },
      } as any);
      renderComponent({
        errorsInTrainedModelDeployment: { elser_model_2: 'Error' },
        saveMappings,
        forceSaveMappings,
        setErrorsInTrainedModelDeployment,
      });
    });

    it('should display text related to errored deployments', () => {
      const modalText = screen.getByTestId('trainedModelsDeploymentModalText');
      expect(modalText).toHaveTextContent('There was an error');
    });

    it('should display only the errored deployment', () => {
      const modal = screen.getByTestId('trainedModelsDeploymentModal');
      expect(modal).toHaveTextContent('elser_model_2');
      expect(modal).not.toHaveTextContent('valid-model');
    });

    it("should call refresh method if 'Try again' button is pressed", () => {
      const tryAgainButton = screen.getByTestId('tryAgainModalButton');
      fireEvent.click(tryAgainButton);
      expect(saveMappings).toHaveBeenCalledTimes(1);
    });
  });
});
