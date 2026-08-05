/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';

import { useLoadNodesPlugins } from '../../../../services';
import { MapperSizePluginId } from '../../../mappings_editor/constants';
import { StepMappingsContainer } from './step_mappings_container';
import { StepMappings } from './step_mappings';

jest.mock('../../../../../shared_imports', () => ({
  Forms: {
    useContent: jest.fn(() => ({
      defaultValue: {},
      updateContent: jest.fn(),
      getSingleContentData: jest.fn(),
    })),
    useMultiContentContext: jest.fn(() => ({ getData: jest.fn() })),
  },
}));

jest.mock('../../../../services', () => ({
  useLoadNodesPlugins: jest.fn(),
}));

jest.mock('./step_mappings', () => ({
  StepMappings: jest.fn(() => null),
}));

const mockUseLoadNodesPlugins = jest.mocked(useLoadNodesPlugins);
const mockStepMappings = jest.mocked(StepMappings);

const renderContainer = () => render(<StepMappingsContainer esDocsBase="" />);

describe('StepMappingsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the loaded nodes plugins to StepMappings', () => {
    mockUseLoadNodesPlugins.mockReturnValue({
      data: [MapperSizePluginId],
    } as ReturnType<typeof useLoadNodesPlugins>);

    renderContainer();

    expect(mockStepMappings).toHaveBeenCalled();
    expect(mockStepMappings.mock.calls[0][0]).toEqual(
      expect.objectContaining({ esNodesPlugins: [MapperSizePluginId] })
    );
  });

  it('falls back to an empty plugin list while plugins are loading', () => {
    mockUseLoadNodesPlugins.mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useLoadNodesPlugins>);

    renderContainer();

    expect(mockStepMappings.mock.calls[0][0]).toEqual(
      expect.objectContaining({ esNodesPlugins: [] })
    );
  });
});
