/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Route } from '@kbn/shared-ux-router';
import { i18nServiceMock, themeServiceMock, analyticsServiceMock } from '@kbn/core/public/mocks';
import { KibanaRenderContextProvider } from '@kbn/react-kibana-context-render';
import { coreMock } from '@kbn/core/public/mocks';
import { EuiTableTestHarness } from '@kbn/test-eui-helpers';
import type { CoreStart, HttpSetup } from '@kbn/core/public';

import { breadcrumbService, IndexManagementBreadcrumb } from '../../../../services/breadcrumbs';
import type { ComponentTemplateListItem } from '../../shared_imports';
import { ComponentTemplateList } from '../../component_template_list/component_template_list';
import { setupEnvironment } from './helpers';
import { WithAppDependencies } from './helpers/setup_environment';
import { API_BASE_PATH } from './helpers/constants';
import { BASE_PATH } from '../../../../../../common';

const startServicesMock = {
  i18n: i18nServiceMock.createStartContract(),
  theme: themeServiceMock.createStartContract(),
  analytics: analyticsServiceMock.createAnalyticsServiceStart(),
};

const renderComponentTemplateList = (
  httpSetup: HttpSetup,
  coreStart: CoreStart,
  options: { filter?: string } = {}
) => {
  const route = `${BASE_PATH}/component_templates${
    options.filter ? `?filter=${options.filter}` : ''
  }`;
  const ListWithRouter = () => (
    <MemoryRouter initialEntries={[route]}>
      <Route
        path={`${BASE_PATH}/component_templates`}
        render={(props) => <ComponentTemplateList {...props} filter={options.filter} />}
      />
    </MemoryRouter>
  );

  return render(
    <KibanaRenderContextProvider {...startServicesMock}>
      {React.createElement(WithAppDependencies(ListWithRouter, httpSetup, coreStart))}
    </KibanaRenderContextProvider>
  );
};

const getTable = () => new EuiTableTestHarness('componentTemplatesTable');
const clickUsageCountHeader = () => {
  const usageHeader = screen.getByRole('columnheader', { name: /Usage count/i });
  const sortButton = within(usageHeader).getByRole('button');
  fireEvent.click(sortButton);
};

const getUsageCount = (row: HTMLElement) => {
  // Avoid querying all cells and indexing into them.
  // In this table, the "Usage count" cell is the only cell whose full text is either a number or "Not in use".
  const usageCell = within(row).getByRole('cell', { name: /^(Not in use|\d+)$/ });
  const text = (usageCell.textContent || '').trim();
  return text === 'Not in use' ? 0 : Number(text);
};

const componentTemplate1: ComponentTemplateListItem = {
  name: 'test_component_template_1',
  hasMappings: true,
  hasAliases: true,
  hasSettings: true,
  usedBy: [],
  isManaged: false,
  isDeprecated: false,
};

const componentTemplate2: ComponentTemplateListItem = {
  name: 'test_component_template_2',
  hasMappings: true,
  hasAliases: true,
  hasSettings: true,
  usedBy: ['test_index_template_1'],
  isManaged: false,
  isDeprecated: false,
};

const componentTemplate3: ComponentTemplateListItem = {
  name: 'test_component_template_3',
  hasMappings: true,
  hasAliases: true,
  hasSettings: true,
  usedBy: ['test_index_template_1', 'test_index_template_2'],
  isManaged: false,
  isDeprecated: true,
};

const componentTemplates = [componentTemplate1, componentTemplate2, componentTemplate3];

describe('<ComponentTemplateList />', () => {
  let httpSetup: ReturnType<typeof setupEnvironment>['httpSetup'];
  let httpRequestsMockHelpers: ReturnType<typeof setupEnvironment>['httpRequestsMockHelpers'];
  let coreStart: ReturnType<(typeof coreMock)['createStart']>;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    const env = setupEnvironment();
    httpSetup = env.httpSetup;
    httpRequestsMockHelpers = env.httpRequestsMockHelpers;
    coreStart = coreMock.createStart();
  });

  test('updates the breadcrumbs to component templates', async () => {
    jest.spyOn(breadcrumbService, 'setBreadcrumbs');
    httpRequestsMockHelpers.setLoadComponentTemplatesResponse([]);
    renderComponentTemplateList(httpSetup, coreStart);
    await screen.findByTestId('emptyList');
    expect(breadcrumbService.setBreadcrumbs).toHaveBeenLastCalledWith(
      IndexManagementBreadcrumb.componentTemplates
    );
  });

  describe('With component templates', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderComponentTemplateList(httpSetup, coreStart);
      await screen.findByTestId('componentTemplatesTable');
    });

    test('should render the list view', async () => {
      const filtered = componentTemplates.filter(({ isDeprecated }) => !isDeprecated);
      const table = getTable();
      await waitFor(() => expect(table.rows).toHaveLength(filtered.length));
      const rows = table.rows;
      const names = rows.map((row) => within(row).getByTestId('templateDetailsLink').textContent);
      expect(names).toEqual(filtered.map(({ name }) => name));
      expect(screen.queryByTestId('deprecatedComponentTemplateBadge')).not.toBeInTheDocument();
    });

    test('should sort "Usage count" column by number', async () => {
      const table = getTable();
      clickUsageCountHeader();
      let rows = table.rows;
      const usageNumbers = rows.map((row) => getUsageCount(row));

      clickUsageCountHeader();
      rows = table.rows;
      const usageNumbers2 = rows.map((row) => getUsageCount(row));

      expect(usageNumbers.length).toBe(2); // deprecated row filtered out
      expect(usageNumbers2.length).toBe(2);
      // Sort toggle should reverse order
      expect(usageNumbers2).toEqual([...usageNumbers].reverse());
    });

    test('Hides deprecated component templates by default and shows when filtered on', async () => {
      await waitFor(() =>
        expect(screen.queryByTestId('deprecatedComponentTemplateBadge')).not.toBeInTheDocument()
      );

      fireEvent.click(screen.getByTestId('componentTemplatesFiltersButton'));
      fireEvent.click(screen.getByTestId('componentTemplates--deprecatedFilter'));

      await waitFor(() =>
        expect(screen.getAllByTestId('deprecatedComponentTemplateBadge')).toHaveLength(1)
      );
    });

    test('should reload the component templates data', async () => {
      fireEvent.click(screen.getByTestId('reloadButton'));
      await waitFor(() => {
        expect(httpSetup.get).toHaveBeenLastCalledWith(
          `${API_BASE_PATH}/component_templates`,
          expect.anything()
        );
      });
    });

    test('should delete a component template', async () => {
      const table = getTable();
      const row = table.getRowByCellText(componentTemplate1.name);
      fireEvent.click(within(row).getByRole('checkbox'));
      const bulkDeleteButton = screen.getByTestId('deleteComponentTemplatexButton');
      fireEvent.click(bulkDeleteButton);

      const modal = await screen.findByTestId('deleteComponentTemplatesConfirmation');
      const confirmButton = within(modal).getByTestId('confirmModalConfirmButton');

      httpRequestsMockHelpers.setDeleteComponentTemplateResponse(componentTemplate1.name, {
        itemsDeleted: [componentTemplate1.name],
        errors: [],
      });

      fireEvent.click(confirmButton);

      await waitFor(() => expect(httpSetup.delete).toHaveBeenCalled());
    });
  });

  describe('if filter is set, component templates are filtered', () => {
    test('search value is set if url param is set', async () => {
      const filter = 'usedBy=(test_index_template_1)';
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(componentTemplates);
      renderComponentTemplateList(httpSetup, coreStart, { filter });
      await screen.findByTestId('componentTemplatesTable');

      const table = getTable();
      await waitFor(() => expect(table.rows).toHaveLength(1));
      expect(within(table.soleRow).getByTestId('templateDetailsLink')).toHaveTextContent(
        'test_component_template_2'
      );
    });
  });

  describe('No component templates', () => {
    test('should display an empty prompt', async () => {
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse([]);
      renderComponentTemplateList(httpSetup, coreStart);
      const emptyPrompt = await screen.findByTestId('emptyList');
      expect(emptyPrompt).toBeInTheDocument();
      expect(within(emptyPrompt).getByTestId('title')).toHaveTextContent(
        'Start by creating a component template'
      );
    });
  });

  describe('Error handling', () => {
    test('should render an error message if error fetching component templates', async () => {
      const error = {
        statusCode: 500,
        error: 'Internal server error',
        message: 'Internal server error',
      };
      httpRequestsMockHelpers.setLoadComponentTemplatesResponse(undefined, error);
      renderComponentTemplateList(httpSetup, coreStart);

      const errorCallout = await screen.findByTestId('componentTemplatesLoadError');
      expect(errorCallout).toBeInTheDocument();
      expect(errorCallout.textContent).toContain('Error loading component templates');
    });
  });
});
