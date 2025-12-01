/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Route } from '@kbn/shared-ux-router';

import { API_BASE_PATH, LOOKUP_INDEX_MODE } from '../../../common/constants';
import { setupEnvironment, WithAppDependencies } from '../helpers';
import { TemplateCreate } from '../../../public/application/sections/template_create';

import {
  TEMPLATE_NAME,
  SETTINGS,
  ALIASES,
  INDEX_PATTERNS as DEFAULT_INDEX_PATTERNS,
} from './constants';

jest.mock('@kbn/code-editor', () => {
  const original = jest.requireActual('@kbn/code-editor');
  return {
    ...original,
    // Mocking CodeEditor, which uses React Monaco under the hood
    CodeEditor: (props: any) => (
      <input
        data-test-subj={props['data-test-subj'] || 'mockCodeEditor'}
        data-currentvalue={props.value}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      />
    ),
  };
});

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');

  return {
    ...original,
    // Mocking EuiComboBox, as it utilizes "react-virtualized" for rendering search suggestions,
    // which does not produce a valid component wrapper
    EuiComboBox: (props: any) => (
      <input
        data-test-subj="mockComboBox"
        onChange={(syntheticEvent: any) => {
          // RTL fireEvent creates DOM event with target.value
          props.onChange([
            { label: syntheticEvent.target.value, value: syntheticEvent.target.value },
          ]);
        }}
      />
    ),
    EuiSuperSelect: (props: any) => (
      <input
        data-test-subj={props['data-test-subj'] || 'mockSuperSelect'}
        value={props.valueOfSelected}
        onChange={(e: any) => {
          props.onChange(e.target.value);
        }}
      />
    ),
  };
});

const TEXT_MAPPING_FIELD = {
  name: 'text_datatype',
  type: 'text',
};

const BOOLEAN_MAPPING_FIELD = {
  name: 'boolean_datatype',
  type: 'boolean',
};

const KEYWORD_MAPPING_FIELD = {
  name: 'keyword_datatype',
  type: 'keyword',
};

const componentTemplate1 = {
  name: 'test_component_template_1',
  hasMappings: true,
  hasAliases: false,
  hasSettings: false,
  usedBy: [],
  isManaged: false,
};

const componentTemplate2 = {
  name: 'test_component_template_2',
  hasMappings: false,
  hasAliases: false,
  hasSettings: true,
  usedBy: ['test_index_template_1'],
  isManaged: false,
};

const componentTemplates = [componentTemplate1, componentTemplate2];

const renderTemplateCreate = (httpSetup: any, isLegacy: boolean = false) => {
  const routePath = isLegacy ? '/create_template?legacy=true' : '/create_template';
  const CreateWithRouter = () => (
    <MemoryRouter initialEntries={[routePath]}>
      <Route path="/create_template" component={TemplateCreate} />
    </MemoryRouter>
  );

  return render(React.createElement(WithAppDependencies(CreateWithRouter, httpSetup)));
};

/**
 * Helper to fill form step-by-step.
 */
const completeStep = {
  async one({
    indexPatterns,
    priority,
    allowAutoCreate,
    version,
    lifecycle,
    indexMode,
    name,
  }: any = {}) {
    if (name) {
      const nameRow = screen.getByTestId('nameField');
      const nameInput = within(nameRow).getByRole('textbox');
      fireEvent.change(nameInput, { target: { value: name } });
    }

    if (indexPatterns) {
      const combobox = screen.getByTestId('mockComboBox');
      indexPatterns.forEach((pattern: string) => {
        fireEvent.change(combobox, { target: { value: pattern } });
      });
    }

    if (indexMode) {
      const toggle = screen.getByTestId('toggleIndexMode');
      if (!toggle.hasAttribute('aria-checked') || toggle.getAttribute('aria-checked') === 'false') {
        fireEvent.click(toggle);
      }
      const indexModeSelect = screen.getByTestId('indexModeField'); // It's mocked as EuiSuperSelect -> input
      fireEvent.change(indexModeSelect, { target: { value: indexMode } });
    }

    if (priority !== undefined) {
      const priorityRow = screen.getByTestId('priorityField');
      const priorityInput = within(priorityRow).getByRole('spinbutton');
      fireEvent.change(priorityInput, { target: { value: String(priority) } });
    }

    if (version !== undefined) {
      const versionRow = screen.getByTestId('versionField');
      const versionInput = within(versionRow).getByRole('spinbutton');
      fireEvent.change(versionInput, { target: { value: String(version) } });
    }

    if (lifecycle) {
      const lifecycleSwitchRow = screen.getByTestId('dataRetentionToggle');
      const lifecycleSwitch = within(lifecycleSwitchRow).getByRole('switch');
      fireEvent.click(lifecycleSwitch);

      await screen.findByTestId('valueDataRetentionField');

      const retentionInput = screen.getByTestId('valueDataRetentionField');
      fireEvent.change(retentionInput, { target: { value: String(lifecycle.value) } });
    }

    if (allowAutoCreate) {
      const autoCreateRow = screen.getByTestId('allowAutoCreateField');

      let labelMatch = /Do not overwrite/;
      if (allowAutoCreate === 'TRUE') labelMatch = /True/;
      if (allowAutoCreate === 'FALSE') labelMatch = /False/;

      const radio = within(autoCreateRow).getByLabelText(labelMatch);
      fireEvent.click(radio);
    }

    // Wait for next button to be enabled (form validation complete)
    await waitFor(() => expect(screen.getByTestId('nextButton')).toBeEnabled());

    fireEvent.click(screen.getByTestId('nextButton'));
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    await screen.findByTestId('stepComponents');

    // Wait for component templates to finish loading
    // The selector will show either the list or an empty prompt
    await waitFor(() => {
      const hasTemplatesList = screen.queryByTestId('componentTemplatesSelection') !== null;
      const hasEmptyPrompt = screen.queryByTestId('emptyPrompt') !== null;
      return hasTemplatesList || hasEmptyPrompt;
    });
  },
  async two(componentName?: string) {
    if (componentName) {
      // Get the component templates list container
      const listContainer = await screen.findByTestId('componentTemplatesList');
      // Find all component name elements within the list
      const componentNames = within(listContainer).getAllByTestId('name');
      const componentsFound = componentNames.map((el) => el.textContent);
      const index = componentsFound.indexOf(componentName);
      if (index >= 0) {
        // Find all add buttons within the list
        const addButtons = within(listContainer).getAllByTestId('action-plusInCircle');
        fireEvent.click(addButtons[index]);
      }
    }

    fireEvent.click(screen.getByTestId('nextButton'));
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    await screen.findByTestId('stepSettings');
  },
  async three(settingsJson?: string, shouldNavigate: boolean = true) {
    if (settingsJson) {
      const editor = screen.getByTestId('settingsEditor');
      fireEvent.change(editor, { target: { value: settingsJson } });
    }
    fireEvent.click(screen.getByTestId('nextButton'));
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    if (shouldNavigate) {
      await screen.findByTestId('stepMappings');
    }
  },
  async four(mappingFields?: any[]) {
    if (mappingFields) {
      for (const field of mappingFields) {
        const { name, type } = field;
        const createFieldForm = screen.getByTestId('createFieldForm');

        const nameInput = screen.getByTestId('nameParameterInput');
        fireEvent.change(nameInput, { target: { value: name } });

        const typeSelect = within(createFieldForm).getByTestId('mockComboBox');
        fireEvent.change(typeSelect, { target: { value: type } });

        const addButton = within(createFieldForm).getByTestId('addButton');

        // Count fields before adding
        const fieldsBefore = screen.queryAllByText(name).length;

        fireEvent.click(addButton);

        // Wait for the field to be added
        await waitFor(() => {
          expect(screen.queryAllByText(name).length).toBeGreaterThan(fieldsBefore);
        });
      }

      // After adding all fields, wait a bit for form state to stabilize
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });
    }

    await screen.findByTestId('documentFields');
    await waitFor(() => expect(screen.getByTestId('nextButton')).toBeEnabled());
    fireEvent.click(screen.getByTestId('nextButton'));

    // Fix for act warning from template_clone
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    await screen.findByTestId('stepAliases');
  },
  async five(aliasesJson?: string, shouldNavigate: boolean = true) {
    if (aliasesJson) {
      const editor = screen.getByTestId('aliasesEditor');
      fireEvent.change(editor, { target: { value: aliasesJson } });
    }
    fireEvent.click(screen.getByTestId('nextButton'));
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    if (shouldNavigate) {
      await screen.findByTestId('summaryTabContent');
    }
  },
};

describe('<TemplateCreate />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeAll(() => {
    jest.useFakeTimers();

    httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
    httpRequestsMockHelpers.setLoadNodesPluginsResponse([]);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('composable index template', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');
    });

    test('should set the correct page title', () => {
      expect(screen.getByTestId('pageTitle')).toHaveTextContent('Create template');
    });

    test('renders no deprecation warning', async () => {
      expect(screen.queryByTestId('legacyIndexTemplateDeprecationWarning')).not.toBeInTheDocument();
    });

    test('should not let the user go to the next step with invalid fields', async () => {
      expect(screen.getByTestId('nextButton')).toBeEnabled();

      fireEvent.click(screen.getByTestId('nextButton'));

      await waitFor(() => {
        expect(screen.getByTestId('nextButton')).toBeDisabled();
      });
    });
  });

  describe('legacy index template', () => {
    beforeEach(async () => {
      renderTemplateCreate(httpSetup, true);
      await screen.findByTestId('pageTitle');
    });

    test('should set the correct page title', () => {
      expect(screen.getByTestId('pageTitle')).toHaveTextContent('Create legacy template');
    });

    test('renders deprecation warning', async () => {
      expect(screen.getByTestId('legacyIndexTemplateDeprecationWarning')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');
    });

    describe('component templates (step 2)', () => {
      beforeEach(async () => {
        await completeStep.one({ name: TEMPLATE_NAME, indexPatterns: ['index1'] });
      });

      it('should set the correct page title', async () => {
        expect(await screen.findByTestId('stepComponents')).toBeInTheDocument();
        expect(screen.getByTestId('stepTitle')).toHaveTextContent('Component templates (optional)');
      });

      it(`doesn't render the deprecated legacy index template warning`, () => {
        expect(
          screen.queryByTestId('legacyIndexTemplateDeprecationWarning')
        ).not.toBeInTheDocument();
      });

      it('should list the available component templates', async () => {
        // Wait for component templates list to load
        const listContainer = await screen.findByTestId('componentTemplatesList', {});
        // Find all component name elements within the list
        const componentNames = within(listContainer).getAllByTestId('name');
        const componentsFound = componentNames.map((el) => el.textContent);
        expect(componentsFound).toEqual(componentTemplates.map((c) => c.name));
      });

      it('should allow to search for a component', async () => {
        fireEvent.change(screen.getByTestId('componentTemplateSearchBox'), {
          target: { value: 'template_2' },
        });

        // Wait for filtered results
        const listContainer = await screen.findByTestId('componentTemplatesList');
        const componentNames = within(listContainer).getAllByTestId('name');
        const componentsFound = componentNames.map((el) => el.textContent);
        expect(componentsFound).toEqual(['test_component_template_2']);
      });

      it('should allow to filter component by Index settings, mappings and aliases', async () => {
        fireEvent.click(screen.getByTestId('filterButton'));

        const filtersList = screen.getAllByTestId('filterItem').map((el) => el.textContent);
        expect(filtersList[0]).toContain('Index settings');
        expect(filtersList[1]).toContain('Mappings');
        expect(filtersList[2]).toContain('Aliases');

        // Select 'settings' (index 0)
        fireEvent.click(screen.getAllByTestId('filterItem')[0]);
        const listAfterSettingsFilter = await screen.findByTestId('componentTemplatesList');
        expect(
          within(listAfterSettingsFilter)
            .getAllByTestId('name')
            .map((el) => el.textContent)
        ).toEqual(['test_component_template_2']);

        // Select 'mappings' (index 1)
        fireEvent.click(screen.getAllByTestId('filterItem')[1]);
        await waitFor(() => {
          expect(screen.queryByTestId('componentTemplatesList')).not.toBeInTheDocument();
        });
        expect(screen.getByTestId('emptySearchResult')).toHaveTextContent(
          'No components match your search'
        );

        // Unselect settings (index 0)
        fireEvent.click(screen.getAllByTestId('filterItem')[0]);
        const listAfterUnselectSettings = await screen.findByTestId('componentTemplatesList');
        expect(
          within(listAfterUnselectSettings)
            .getAllByTestId('name')
            .map((el) => el.textContent)
        ).toEqual(['test_component_template_1']);

        // Unselect mappings (index 1)
        fireEvent.click(screen.getAllByTestId('filterItem')[1]);
        const listAfterUnselectMappings = await screen.findByTestId('componentTemplatesList');
        expect(
          within(listAfterUnselectMappings)
            .getAllByTestId('name')
            .map((el) => el.textContent)
        ).toEqual(['test_component_template_1', 'test_component_template_2']);

        // Select aliases (index 2)
        fireEvent.click(screen.getAllByTestId('filterItem')[2]);
        await waitFor(() => {
          expect(screen.queryByTestId('componentTemplatesList')).not.toBeInTheDocument();
        });
      });

      it('should allow to select and unselect a component template', async () => {
        // Start with empty selection
        expect(screen.getByTestId('emptyPrompt')).toHaveTextContent(
          'Add component template building blocks to this template.'
        );

        // Select first component in the list
        const listContainer = await screen.findByTestId('componentTemplatesList');
        const addButtons = within(listContainer).getAllByTestId('action-plusInCircle');
        fireEvent.click(addButtons[0]);

        await waitFor(() => {
          expect(screen.queryByTestId('emptyPrompt')).not.toBeInTheDocument();
        });

        // Check selected component appears in the selection area
        const selectionContainer = screen.getByTestId('componentTemplatesSelection');
        expect(
          within(selectionContainer)
            .getAllByTestId('name')
            .map((el) => el.textContent)
        ).toEqual(['test_component_template_1']);

        // Unselect the component
        const removeButtons = within(selectionContainer).getAllByTestId('action-minusInCircle');
        fireEvent.click(removeButtons[0]);

        await waitFor(() => {
          expect(screen.getByTestId('emptyPrompt')).toBeInTheDocument();
        });
      });
    });

    describe('index settings (step 3)', () => {
      beforeEach(async () => {
        // Logistics
        await completeStep.one({
          name: TEMPLATE_NAME,
          indexPatterns: ['index1'],
          indexMode: LOOKUP_INDEX_MODE,
        });
        // Component templates
        await completeStep.two();
      });

      it('should set the correct page title', async () => {
        expect(await screen.findByTestId('stepSettings')).toBeInTheDocument();
        expect(screen.getByTestId('stepTitle')).toHaveTextContent('Index settings (optional)');
      });

      it('should display a warning callout displaying the selected index mode', async () => {
        expect(await screen.findByTestId('indexModeCallout')).toBeInTheDocument();
        expect(screen.getByTestId('indexModeCallout')).toHaveTextContent(
          'The index.mode setting has been set to Lookup within the Logistics step.'
        );
      });

      it('should not allow invalid json', async () => {
        await completeStep.three('{ invalidJsonString ', false);

        expect(await screen.findByText(/Invalid JSON format/)).toBeInTheDocument();
      });

      it('should not allow setting number_of_shards to a value different from 1 for Lookup index mode', async () => {
        // The Lookup index mode was already selected in the first (Logistics) step
        await completeStep.three('{ "index.number_of_shards": 2 }', false);

        expect(
          await screen.findByText(/Number of shards for lookup index mode can only be 1 or unset/)
        ).toBeInTheDocument();
      });
    });

    describe('mappings (step 4)', () => {
      const navigateToMappingsStep = async () => {
        // Logistics
        await completeStep.one({ name: TEMPLATE_NAME, indexPatterns: ['index1'] });
        // Component templates
        await completeStep.two();
        // Index settings
        await completeStep.three('{}');
      };

      const addMappingField = async (name: string, type: string) => {
        const createFieldForm = screen.getByTestId('createFieldForm');

        const nameInput = screen.getByTestId('nameParameterInput');
        fireEvent.change(nameInput, { target: { value: name } });

        const typeSelect = within(createFieldForm).getByTestId('mockComboBox');
        fireEvent.change(typeSelect, { target: { value: type } });

        const addButton = within(createFieldForm).getByTestId('addButton');

        // Count current fields before adding
        const fieldsBefore = screen.queryAllByText(name).length;

        fireEvent.click(addButton);

        // Wait for the new field to appear in the list
        await waitFor(() => {
          expect(screen.queryAllByText(name).length).toBeGreaterThan(fieldsBefore);
        });
      };

      beforeEach(async () => {
        await navigateToMappingsStep();
      });

      it('should set the correct page title', async () => {
        expect(await screen.findByTestId('stepMappings')).toBeInTheDocument();
        expect(screen.getByTestId('stepTitle')).toHaveTextContent('Mappings (optional)');
      });

      it('should allow the user to define document fields for a mapping', async () => {
        await addMappingField('field_1', 'text');
        await addMappingField('field_2', 'text');
        await addMappingField('field_3', 'text');

        // Fields have test IDs like "fieldsListItem field_1", so we need to find by partial match
        const fieldsListItems = screen.getAllByTestId((content, element) => {
          return content.startsWith('fieldsListItem ');
        });
        expect(fieldsListItems).toHaveLength(3);
      });

      it('should allow the user to remove a document field from a mapping', async () => {
        await addMappingField('field_1', 'text');
        await addMappingField('field_2', 'text');

        const getFieldsListItems = () =>
          screen.getAllByTestId((content, element) => {
            return content.startsWith('fieldsListItem ');
          });

        expect(getFieldsListItems()).toHaveLength(2);

        const createFieldForm = screen.getByTestId('createFieldForm');
        fireEvent.click(within(createFieldForm).getByTestId('cancelButton'));

        // Remove first field
        const removeButtons = screen.getAllByTestId('removeFieldButton');
        fireEvent.click(removeButtons[0]);

        // Confirm modal
        const confirmButton = await screen.findByTestId('confirmModalConfirmButton');
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(getFieldsListItems()).toHaveLength(1);
        });
      });

      describe('plugin parameters', () => {
        const selectMappingsEditorTab = async (
          tab: 'fields' | 'runtimeFields' | 'templates' | 'advanced'
        ) => {
          const tabIndex = ['fields', 'runtimeFields', 'templates', 'advanced'].indexOf(tab);
          const tabs = screen.getAllByTestId('formTab');
          fireEvent.click(tabs[tabIndex]);
        };

        test('should not render the _size parameter if the mapper size plugin is not installed', async () => {
          // Navigate to the advanced configuration
          await selectMappingsEditorTab('advanced');

          expect(screen.queryByTestId('sizeEnabledToggle')).not.toBeInTheDocument();
        });
      });
    });

    describe('aliases (step 5)', () => {
      beforeEach(async () => {
        // Logistics
        await completeStep.one({ name: TEMPLATE_NAME, indexPatterns: ['index1'] });
        // Component templates
        await completeStep.two();
        // Index settings
        await completeStep.three('{}');
        // Mappings
        await completeStep.four();
      });

      it('should set the correct page title', async () => {
        expect(await screen.findByTestId('stepAliases')).toBeInTheDocument();
        expect(screen.getByTestId('stepTitle')).toHaveTextContent('Aliases (optional)');
      });

      it('should not allow invalid json', async () => {
        // Complete step 5 (aliases) with invalid json
        await completeStep.five('{ invalidJsonString ', false);

        expect(await screen.findByText('Invalid JSON format.')).toBeInTheDocument();
      });
    });
  });

  // Isolated test for mapper-size plugin (needs different mock setup)
  describe('mapper-size plugin', () => {
    test('should render the _size parameter if the mapper size plugin is installed', async () => {
      httpRequestsMockHelpers.setLoadNodesPluginsResponse(['mapper-size']);
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);

      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');

      // Navigate to mappings step
      await completeStep.one({ name: TEMPLATE_NAME, indexPatterns: ['index1'] });
      await completeStep.two();
      await completeStep.three('{}');

      // Navigate to advanced tab
      const tabs = screen.getAllByTestId('formTab');
      fireEvent.click(tabs[3]); // advanced is index 3

      expect(screen.getByTestId('sizeEnabledToggle')).toBeInTheDocument();
    });
  });

  describe('logistics (step 1)', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');
    });

    it('setting index pattern to logs-*-* should set the index mode to logsdb', async () => {
      // Logistics
      await completeStep.one({ name: 'my_logs_template', indexPatterns: ['logs-*-*'] });
      // Component templates
      await completeStep.two();
      // Index settings
      await completeStep.three('{}');
      // Mappings
      await completeStep.four();
      // Aliases
      await completeStep.five();

      fireEvent.click(screen.getByTestId('nextButton'));

      await waitFor(() => {
        expect(httpSetup.post).toHaveBeenLastCalledWith(
          `${API_BASE_PATH}/index_templates`,
          expect.objectContaining({
            body: JSON.stringify({
              name: 'my_logs_template',
              indexPatterns: ['logs-*-*'],
              allowAutoCreate: 'NO_OVERWRITE',
              indexMode: 'logsdb',
              _kbnMeta: {
                type: 'default',
                hasDatastream: false,
                isLegacy: false,
              },
              template: {},
            }),
          })
        );
      });
    });
  });

  describe('review (step 6)', () => {
    describe('default flow', () => {
      beforeEach(async () => {
        httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
        renderTemplateCreate(httpSetup);
        await screen.findByTestId('pageTitle');

        // Logistics
        await completeStep.one({
          name: TEMPLATE_NAME,
          indexPatterns: DEFAULT_INDEX_PATTERNS,
        });
        // Component templates
        await completeStep.two('test_component_template_1');
        // Index settings
        await completeStep.three(JSON.stringify(SETTINGS));
        // Mappings
        await completeStep.four();
        // Aliases
        await completeStep.five(JSON.stringify(ALIASES));
      });

      it('should set the correct step title', async () => {
        expect(await screen.findByTestId('stepSummary')).toBeInTheDocument();
        expect(screen.getByTestId('stepTitle')).toHaveTextContent(
          `Review details for '${TEMPLATE_NAME}'`
        );
      });

      describe('tabs', () => {
        test('should have 3 tabs', () => {
          const tabs = within(screen.getByTestId('summaryTabContent')).getAllByRole('tab');
          expect(tabs).toHaveLength(3);
          expect(tabs.map((t) => t.textContent)).toEqual(['Summary', 'Preview', 'Request']);
        });

        test('should navigate to the preview and request tab', async () => {
          expect(screen.getByTestId('summaryTab')).toBeInTheDocument();
          expect(screen.queryByTestId('requestTab')).not.toBeInTheDocument();
          expect(screen.queryByTestId('previewTab')).not.toBeInTheDocument();

          fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
          expect(screen.queryByTestId('summaryTab')).not.toBeInTheDocument();
          expect(screen.getByTestId('previewTab')).toBeInTheDocument();

          fireEvent.click(screen.getByRole('tab', { name: 'Request' }));
          expect(screen.queryByTestId('previewTab')).not.toBeInTheDocument();
          expect(screen.getByTestId('requestTab')).toBeInTheDocument();
        });
      });
    });

    it('should render a warning message if a wildcard is used as an index pattern', async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');

      // Logistics
      await completeStep.one({
        name: TEMPLATE_NAME,
        indexPatterns: ['*'], // Set wildcard index pattern
      });
      // Component templates
      await completeStep.two();
      // Index settings
      await completeStep.three(JSON.stringify({}));
      // Mappings
      await completeStep.four();
      // Aliases
      await completeStep.five(JSON.stringify({}));

      expect(await screen.findByTestId('indexPatternsWarning')).toBeInTheDocument();
      expect(screen.getByTestId('indexPatternsWarningDescription')).toHaveTextContent(
        'All new indices that you create will use this template. Edit index patterns.'
      );
    });
  });

  describe('form payload & api errors', () => {
    beforeEach(async () => {
      const MAPPING_FIELDS = [BOOLEAN_MAPPING_FIELD, TEXT_MAPPING_FIELD, KEYWORD_MAPPING_FIELD];

      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');

      // Logistics
      await completeStep.one({
        name: TEMPLATE_NAME,
        indexPatterns: DEFAULT_INDEX_PATTERNS,
        allowAutoCreate: 'TRUE',
        indexMode: 'time_series',
      });
      // Component templates
      await completeStep.two('test_component_template_1');
      // Index settings
      await completeStep.three(JSON.stringify(SETTINGS));
      // Mappings
      await completeStep.four(MAPPING_FIELDS);
      // Aliases
      await completeStep.five(JSON.stringify(ALIASES));
    });

    it('should send the correct payload', async () => {
      expect(screen.getByTestId('stepTitle')).toHaveTextContent(
        `Review details for '${TEMPLATE_NAME}'`
      );

      fireEvent.click(screen.getByTestId('nextButton'));

      await waitFor(() => {
        expect(httpSetup.post).toHaveBeenLastCalledWith(
          `${API_BASE_PATH}/index_templates`,
          expect.objectContaining({
            body: JSON.stringify({
              name: TEMPLATE_NAME,
              indexPatterns: DEFAULT_INDEX_PATTERNS,
              allowAutoCreate: 'TRUE',
              dataStream: {},
              indexMode: 'time_series',
              _kbnMeta: {
                type: 'default',
                hasDatastream: false,
                isLegacy: false,
              },
              composedOf: ['test_component_template_1'],
              template: {
                settings: SETTINGS,
                mappings: {
                  properties: {
                    [BOOLEAN_MAPPING_FIELD.name]: {
                      type: BOOLEAN_MAPPING_FIELD.type,
                    },
                    [TEXT_MAPPING_FIELD.name]: {
                      type: TEXT_MAPPING_FIELD.type,
                    },
                    [KEYWORD_MAPPING_FIELD.name]: {
                      type: KEYWORD_MAPPING_FIELD.type,
                    },
                  },
                },
                aliases: ALIASES,
              },
            }),
          })
        );
      });
    });

    it('should surface the API errors from the put HTTP request', async () => {
      const error = {
        statusCode: 409,
        error: 'Conflict',
        message: `There is already a template with name '${TEMPLATE_NAME}'`,
      };

      httpRequestsMockHelpers.setCreateTemplateResponse(undefined, error);

      fireEvent.click(screen.getByTestId('nextButton'));

      expect(await screen.findByTestId('saveTemplateError')).toBeInTheDocument();
      expect(screen.getByTestId('saveTemplateError')).toHaveTextContent(error.message);
    });
  });

  describe('DSL', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderTemplateCreate(httpSetup);
      await screen.findByTestId('pageTitle');

      await completeStep.one({
        name: TEMPLATE_NAME,
        indexPatterns: DEFAULT_INDEX_PATTERNS,
        lifecycle: {
          enabled: true,
          value: 1,
          unit: 'd',
        },
      });
    });

    test('should include DSL in summary when set in step 1', async () => {
      await completeStep.two();
      await completeStep.three();
      await completeStep.four();
      await completeStep.five();

      expect(await screen.findByTestId('lifecycleValue')).toBeInTheDocument();
      expect(screen.getByTestId('lifecycleValue')).toHaveTextContent('1 day');
    });

    test('preview data stream', async () => {
      await completeStep.two();
      await completeStep.three();
      await completeStep.four();
      await completeStep.five();

      // Clear previous post calls to isolate this test
      (httpSetup.post as jest.Mock).mockClear();

      // Click the Preview tab in the review step
      const previewTab = screen.getByTestId('stepReviewPreviewTab');
      fireEvent.click(previewTab);

      // Wait for SimulateTemplate to render and make the API call
      await waitFor(() => {
        expect(httpSetup.post).toHaveBeenCalled();
        const calls = (httpSetup.post as jest.Mock).mock.calls;
        const simulateCall = calls.find((call) =>
          call[0].includes(`${API_BASE_PATH}/index_templates/simulate`)
        );
        expect(simulateCall).toBeDefined();
        const body = JSON.parse(simulateCall[1].body);
        expect(body.template.lifecycle).toEqual({
          enabled: true,
          data_retention: '1d',
        });
        expect(body.index_patterns).toEqual(DEFAULT_INDEX_PATTERNS);
        expect(body.data_stream).toEqual({});
      });
    });
  });
});
