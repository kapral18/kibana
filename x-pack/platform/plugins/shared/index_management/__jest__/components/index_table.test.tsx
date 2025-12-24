/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '@kbn/i18n-react';
import { EuiPaginationTestHarness, EuiTableTestHarness } from '@kbn/test-eui-helpers';

import type { AppDependencies } from '../../public/application/app_context';
import { AppContextProvider } from '../../public/application/app_context';
import type { Index } from '../../common';
import { BASE_PATH } from '../../common/constants';
import { AppWithoutRouter } from '../../public/application/app';
import { loadIndicesSuccess } from '../../public/application/store/actions';
import { breadcrumbService } from '../../public/application/services/breadcrumbs';
import { UiMetricService } from '../../public/application/services/ui_metric';
import { notificationService } from '../../public/application/services/notification';
import { httpService } from '../../public/application/services/http';
import { setUiMetricService } from '../../public/application/services/api';
import { indexManagementStore } from '../../public/application/store';
import { setExtensionsService } from '../../public/application/store/selectors/extension_service';
import { init as initHttpRequests } from '../client_integration/helpers/http_requests';
import { kibanaVersion } from '../client_integration/helpers/setup_environment';
import { runPendingTimers, runPendingTimersUntil } from '../helpers/fake_timers';
import { ExtensionsService } from '../../public/services';

import {
  notificationServiceMock,
  executionContextServiceMock,
  chromeServiceMock,
} from '@kbn/core/public/mocks';

jest.mock('react-use/lib/useObservable', () => () => jest.fn());

const createIndices = (): Index[] => {
  const indices: Index[] = [];

  // Keep this dataset intentionally small for test performance while still covering:
  // - pagination (page size 10, page 2)
  // - per-page selection to 50
  // - sorting
  // - hidden indices (.admin1, .admin3)
  // - lookup index presence
  const MAX_TESTY_INDEX = 29;

  const getBaseFakeIndex = (isOpen: boolean): Omit<Index, 'name'> =>
    ({
      health: isOpen ? 'green' : 'yellow',
      status: isOpen ? 'open' : 'closed',
      primary: 1,
      replica: 1,
      documents: 10000,
      documents_deleted: 100,
      size: '156kb',
      primary_size: '156kb',
    } as unknown as Omit<Index, 'name'>);

  for (let i = 0; i <= MAX_TESTY_INDEX; i++) {
    indices.push({
      ...(getBaseFakeIndex(true) as unknown as Index),
      name: `testy${i}`,
    });
    indices.push({
      ...(getBaseFakeIndex(false) as unknown as Index),
      name: `.admin${i}`,
      // Add 2 hidden indices in the list in position 3 & 7
      // note: for each loop iteration we add 2 indices
      hidden: i === 1 || i === 3 ? true : false, // ".admin1" and ".admin3" are the only hidden in 8.x
    } as unknown as Index);
  }

  indices.push({
    ...(getBaseFakeIndex(true) as unknown as Index),
    name: `lookup-index`,
    mode: 'lookup',
  } as unknown as Index);

  return indices;
};

const urlServiceMock: AppDependencies['url'] = {
  locators: {
    get: () =>
      ({
        navigate: async () => {},
      } as unknown),
  },
} as unknown as AppDependencies['url'];

const getNamesText = () => {
  return screen.getAllByTestId('indexTableIndexNameLink').map((el) => el.textContent || '');
};

const getRowIndexByName = (indexName: string) => {
  return getNamesText().indexOf(indexName);
};

const getStatusTextAtRow = (rowIndex: number) => {
  const statusCells = screen.getAllByTestId('indexTableCell-status');
  const cell = statusCells[rowIndex];
  return (cell?.textContent || '').trim();
};

const openMenuAndClickOption = async (rowIndex: number, optionTestSubj: string) => {
  const checkboxes = screen.getAllByTestId('indexTableRowCheckbox');
  fireEvent.click(checkboxes[rowIndex]);

  const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
  fireEvent.click(manageButton);

  const menu = await screen.findByTestId('indexContextMenu');
  const option = within(menu).getByTestId(optionTestSubj);
  fireEvent.click(option);
};

const clickRowCheckboxAtRowIndex = (rowIndex: number) => {
  const checkboxes = screen.getAllByTestId('indexTableRowCheckbox');
  const checkbox = checkboxes[rowIndex];

  if (!checkbox) {
    throw new Error(`Expected to find checkbox at row index ${rowIndex}`);
  }

  fireEvent.click(checkbox);
};

const clickRowCheckboxByName = (indexName: string) => {
  const rowIndex = getRowIndexByName(indexName);

  if (rowIndex < 0) {
    throw new Error(`Expected index "${indexName}" to exist in the table`);
  }

  clickRowCheckboxAtRowIndex(rowIndex);
};

const getRowIndicesByStatus = (statusText: string) => {
  const statusCells = screen.getAllByTestId('indexTableCell-status');
  return statusCells
    .map((cell, idx) => ({ idx, text: (cell.textContent || '').trim() }))
    .filter(({ text }) => text === statusText)
    .map(({ idx }) => idx);
};

const openMenuAndGetButtonText = async (rowIndex: number) => {
  const checkboxes = screen.getAllByTestId('indexTableRowCheckbox');
  fireEvent.click(checkboxes[rowIndex]);

  const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
  fireEvent.click(manageButton);

  const menu = await screen.findByTestId('indexContextMenu');
  return within(menu)
    .getAllByRole('button')
    .map((btn) => (btn.textContent || '').trim())
    .filter((t) => t.length > 0);
};

const renderIndexApp = async (options?: {
  dependenciesOverride?: Partial<AppDependencies>;
  loadIndicesResponse?: unknown;
  reloadIndicesResponse?: unknown;
  delayResponse?: boolean;
}) => {
  const { dependenciesOverride, loadIndicesResponse, reloadIndicesResponse, delayResponse } =
    options || {};

  const { httpSetup, httpRequestsMockHelpers, setDelayResponse } = initHttpRequests();

  // For tests that need to observe intermediate in-flight UI states (e.g. "flushing..."),
  // delay HTTP promise resolution so the UI doesn't transition immediately.
  setDelayResponse(Boolean(delayResponse));

  httpRequestsMockHelpers.setLoadIndicesResponse(loadIndicesResponse ?? indices);
  httpRequestsMockHelpers.setReloadIndicesResponse(reloadIndicesResponse ?? indices);

  // Mock initialization of services
  const services = {
    extensionsService: new ExtensionsService(),
    uiMetricService: new UiMetricService('index_management'),
  };
  services.uiMetricService.setup({ reportUiCounter() {} } as any);
  setExtensionsService(services.extensionsService);
  setUiMetricService(services.uiMetricService);

  httpService.setup(httpSetup);
  breadcrumbService.setup(() => undefined);
  notificationService.setup(notificationServiceMock.createStartContract());

  const store = indexManagementStore(services as any);

  const appDependencies = {
    services,
    core: {
      getUrlForApp: () => {},
      executionContext: executionContextServiceMock.createStartContract(),
      chrome: chromeServiceMock.createStartContract(),
    },
    plugins: {
      reindexService: {},
    },
    url: urlServiceMock,
    // Default stateful configuration
    config: {
      enableLegacyTemplates: true,
      enableIndexActions: true,
      enableIndexStats: true,
    },
    privs: {
      monitor: true,
      manageEnrich: true,
      monitorEnrich: true,
    },
  } as unknown as AppDependencies;

  store.dispatch(loadIndicesSuccess({ indices }));

  render(
    <I18nProvider>
      <Provider store={store}>
        <MemoryRouter initialEntries={[`${BASE_PATH}indices`]}>
          <AppContextProvider value={{ ...appDependencies, ...(dependenciesOverride || {}) }}>
            <AppWithoutRouter />
          </AppContextProvider>
        </MemoryRouter>
      </Provider>
    </I18nProvider>
  );

  await runPendingTimers();

  await screen.findByTestId('indexTable');

  return { httpSetup, httpRequestsMockHelpers };
};

const indices = createIndices();

describe('index table', () => {
  beforeEach(() => {
    // NOTE: This suite intentionally uses fake timers for performance.
    // Some tests use delayed HTTP responses to assert intermediate UI states (e.g. "flushing..."),
    // which would otherwise require waiting real-time seconds in CI.
    jest.useFakeTimers();
    jest.clearAllTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(async () => {
    await runPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('should change pages when a pagination link is clicked on', async () => {
    await renderIndexApp();

    // Page 1 first row
    const indexTable = new EuiTableTestHarness('indexTable');
    expect(within(indexTable.firstRow).getByTestId('indexTableIndexNameLink')).toHaveTextContent(
      'testy0'
    );

    const pagination = new EuiPaginationTestHarness();
    pagination.clickButton('2');

    await waitFor(() => {
      expect(within(indexTable.firstRow).getByTestId('indexTableIndexNameLink')).toHaveTextContent(
        'testy6'
      );
    });
  });

  test('should show more when per page value is increased', async () => {
    await renderIndexApp();

    // Open the items-per-page popover (EuiTablePagination)
    const itemsPerPageButton = screen.getByRole('button', { name: /Rows per page/i });
    fireEvent.click(itemsPerPageButton);

    // Select 50
    const option50 = await screen.findByText('50 rows');
    fireEvent.click(option50);

    await waitFor(() => {
      expect(screen.getAllByTestId('indexTableIndexNameLink')).toHaveLength(50);
    });
  });

  test('should show the Actions menu button only when at least one row is selected', async () => {
    await renderIndexApp();

    expect(screen.queryByTestId('indexActionsContextMenuButton')).not.toBeInTheDocument();

    clickRowCheckboxByName('testy0');

    expect(await screen.findByTestId('indexActionsContextMenuButton')).toBeInTheDocument();
  });

  test('should update the Actions menu button text when more than one row is selected', async () => {
    await renderIndexApp();

    expect(screen.queryByTestId('indexActionsContextMenuButton')).not.toBeInTheDocument();

    clickRowCheckboxByName('testy0');
    expect(await screen.findByTestId('indexActionsContextMenuButton')).toHaveTextContent(
      'Manage index'
    );

    clickRowCheckboxByName('testy1');
    expect(screen.getByTestId('indexActionsContextMenuButton')).toHaveTextContent(
      'Manage 2 indices'
    );
  });

  test('should show hidden indices only when the switch is turned on', async () => {
    await renderIndexApp();

    // We have manually set `.admin1` and `.admin3` as hidden indices
    // We **don't** expect them to be in this list as by default we don't show hidden indices
    let indicesInTable = getNamesText();
    expect(indicesInTable).not.toContain('.admin1');
    expect(indicesInTable).not.toContain('.admin3');

    if (kibanaVersion.major >= 8) {
      // From 8.x indices starting with a period are treated as normal indices
      expect(indicesInTable).toContain('.admin0');
      expect(indicesInTable).toContain('.admin2');
    } else {
      // In 7.x those are treated as system and are thus hidden
      expect(indicesInTable).not.toContain('.admin0');
      expect(indicesInTable).not.toContain('.admin2');
    }

    // Enable "Show hidden indices"
    fireEvent.click(screen.getByTestId('checkboxToggles-includeHiddenIndices'));

    await waitFor(() => {
      indicesInTable = getNamesText();
      expect(indicesInTable).toContain('.admin1');
      expect(indicesInTable).toContain('.admin3');
    });
  });

  test('should filter based on content of search input', async () => {
    await renderIndexApp();

    const searchInput = screen.getByTestId('indicesSearch');
    fireEvent.change(searchInput, { target: { value: 'testy0' } });

    await waitFor(() => {
      expect(getNamesText()).toEqual(['testy0']);
    });
  });

  test('should sort when header is clicked', async () => {
    await renderIndexApp();
    const indexTable = new EuiTableTestHarness('indexTable');

    const headerCell = screen.getByTestId('indexTableHeaderCell-name');
    const sortButton = within(headerCell).getByRole('button');

    fireEvent.click(sortButton);

    expect(within(indexTable.firstRow).getByTestId('indexTableIndexNameLink')).toHaveTextContent(
      '.admin0'
    );

    fireEvent.click(sortButton);

    // Descending lexical sort means `testy9` will come before `testy29` (`"9"` > `"2"`).
    expect(within(indexTable.firstRow).getByTestId('indexTableIndexNameLink')).toHaveTextContent(
      'testy9'
    );
  });

  test('should show the right context menu options when one index is selected and open', async () => {
    await renderIndexApp();

    const items = await openMenuAndGetButtonText(0);

    expect(items).toEqual([
      'Show index overview',
      'Show index settings',
      'Show index mapping',
      'Show index stats',
      'Close index',
      'Force merge index',
      'Refresh index',
      'Clear index cache',
      'Flush index',
      'Delete index',
      'Convert to lookup index',
    ]);
  });

  test('should show the right context menu options when one index is selected and closed', async () => {
    await renderIndexApp();

    const items = await openMenuAndGetButtonText(1);

    expect(items).toEqual([
      'Show index overview',
      'Show index settings',
      'Show index mapping',
      'Open index',
      'Delete index',
      'Convert to lookup index',
    ]);
  });

  test('should not show "Convert to lookup index" option in the context menu when lookup index is selected', async () => {
    await renderIndexApp();

    const indexName = 'lookup-index';

    const searchInput = screen.getByTestId('indicesSearch');
    fireEvent.change(searchInput, { target: { value: indexName } });

    const rowIndex = getRowIndexByName(indexName);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    const items = await openMenuAndGetButtonText(rowIndex);

    expect(items).toEqual([
      'Show index overview',
      'Show index settings',
      'Show index mapping',
      'Show index stats',
      'Close index',
      'Force merge index',
      'Refresh index',
      'Clear index cache',
      'Flush index',
      'Delete index',
    ]);
  });

  test('should not show "Convert to lookup index" option in the context menu when hidden index is selected', async () => {
    await renderIndexApp();

    const indexName = '.admin1';

    // Enable "Show hidden indices" so we can select `.admin1`
    fireEvent.click(screen.getByTestId('checkboxToggles-includeHiddenIndices'));

    const searchInput = screen.getByTestId('indicesSearch');
    fireEvent.change(searchInput, { target: { value: indexName } });

    const rowIndex = getRowIndexByName(indexName);
    expect(rowIndex).toBeGreaterThanOrEqual(0);

    const items = await openMenuAndGetButtonText(rowIndex);

    expect(items).toEqual([
      'Show index overview',
      'Show index settings',
      'Show index mapping',
      'Open index',
      'Delete index',
    ]);
  });

  test('should show the right context menu options when one open and one closed index is selected', async () => {
    await renderIndexApp();

    clickRowCheckboxByName('testy0');
    const [closedRowIndex] = getRowIndicesByStatus('closed');
    expect(closedRowIndex).toBeGreaterThanOrEqual(0);
    clickRowCheckboxAtRowIndex(closedRowIndex);

    const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
    fireEvent.click(manageButton);

    const menu = await screen.findByTestId('indexContextMenu');
    const items = within(menu)
      .getAllByRole('button')
      .map((btn) => (btn.textContent || '').trim())
      .filter((t) => t.length > 0);

    expect(items).toEqual(['Open indices', 'Delete indices']);
  });

  test('should show the right context menu options when more than one open index is selected', async () => {
    await renderIndexApp();

    clickRowCheckboxByName('testy0');
    clickRowCheckboxByName('testy2');

    const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
    fireEvent.click(manageButton);

    const menu = await screen.findByTestId('indexContextMenu');
    const items = within(menu)
      .getAllByRole('button')
      .map((btn) => (btn.textContent || '').trim())
      .filter((t) => t.length > 0);

    expect(items).toEqual([
      'Close indices',
      'Force merge indices',
      'Refresh indices',
      'Clear indices cache',
      'Flush indices',
      'Delete indices',
    ]);
  });

  test('should show the right context menu options when more than one closed index is selected', async () => {
    await renderIndexApp();

    const closedRowIndices = getRowIndicesByStatus('closed');
    expect(closedRowIndices.length).toBeGreaterThanOrEqual(2);
    clickRowCheckboxAtRowIndex(closedRowIndices[0]);
    clickRowCheckboxAtRowIndex(closedRowIndices[1]);

    const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
    fireEvent.click(manageButton);

    const menu = await screen.findByTestId('indexContextMenu');
    const items = within(menu)
      .getAllByRole('button')
      .map((btn) => (btn.textContent || '').trim())
      .filter((t) => t.length > 0);

    expect(items).toEqual(['Open indices', 'Delete indices']);
  });

  test('flush button works from context menu', async () => {
    await renderIndexApp({ delayResponse: true });

    const rowIndex = getRowIndexByName('testy0');

    // Snapshot equivalent: initial state
    expect(getStatusTextAtRow(rowIndex)).toBe('open');

    await openMenuAndClickOption(rowIndex, 'flushIndexMenuButton');

    expect(getStatusTextAtRow(rowIndex)).toBe('flushing...');

    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'open');
  });

  test('clear cache button works from context menu', async () => {
    await renderIndexApp({ delayResponse: true });

    const rowIndex = getRowIndexByName('testy0');

    expect(getStatusTextAtRow(rowIndex)).toBe('open');

    await openMenuAndClickOption(rowIndex, 'clearCacheIndexMenuButton');

    expect(getStatusTextAtRow(rowIndex)).toBe('clearing cache...');

    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'open');
  });

  test('refresh button works from context menu', async () => {
    await renderIndexApp({ delayResponse: true });

    const rowIndex = getRowIndexByName('testy0');

    expect(getStatusTextAtRow(rowIndex)).toBe('open');

    await openMenuAndClickOption(rowIndex, 'refreshIndexMenuButton');

    expect(getStatusTextAtRow(rowIndex)).toBe('refreshing...');

    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'open');
  });

  test('force merge button works from context menu', async () => {
    await renderIndexApp({ delayResponse: true });

    const rowIndex = getRowIndexByName('testy0');

    expect(getStatusTextAtRow(rowIndex)).toBe('open');

    // Open menu and click force merge
    const checkboxes = screen.getAllByTestId('indexTableRowCheckbox');
    fireEvent.click(checkboxes[rowIndex]);

    const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
    fireEvent.click(manageButton);

    const menu = await screen.findByTestId('indexContextMenu');
    fireEvent.click(within(menu).getByTestId('forcemergeIndexMenuButton'));

    // Modal should appear
    const confirmButton = await screen.findByTestId('confirmModalConfirmButton');

    // Snapshot equivalent: "forcing merge..." after confirm
    fireEvent.click(confirmButton);

    expect(getStatusTextAtRow(rowIndex)).toBe('forcing merge...');

    // Modal should close once request resolves
    await runPendingTimersUntil(() => screen.queryByTestId('confirmModalConfirmButton') === null);
    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'open');
  });

  test('close index button works from context menu', async () => {
    const modifiedIndices = indices.map((index) => {
      return {
        ...index,
        status: index.name === 'testy0' ? 'close' : index.status,
      };
    });

    await renderIndexApp({ reloadIndicesResponse: modifiedIndices, delayResponse: true });

    const rowIndex = getRowIndexByName('testy0');

    expect(getStatusTextAtRow(rowIndex)).toBe('open');

    await openMenuAndClickOption(rowIndex, 'closeIndexMenuButton');

    expect(getStatusTextAtRow(rowIndex)).toBe('closing...');

    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'closed');
  });

  test('open index button works from context menu', async () => {
    const modifiedIndices = indices.map((index) => {
      return {
        ...index,
        status: index.name === 'testy1' ? 'closed' : index.status,
      };
    });

    await renderIndexApp({ loadIndicesResponse: modifiedIndices, delayResponse: true });

    const rowIndex = getRowIndexByName('testy1');

    expect(getStatusTextAtRow(rowIndex)).toBe('closed');

    await openMenuAndClickOption(rowIndex, 'openIndexMenuButton');

    expect(getStatusTextAtRow(rowIndex)).toBe('opening...');

    await runPendingTimersUntil(() => getStatusTextAtRow(rowIndex) === 'open');
  });

  describe('Common index actions', () => {
    test('Common index actions should be hidden when feature is turned off', async () => {
      await renderIndexApp({
        dependenciesOverride: {
          config: { enableIndexActions: false, enableLegacyTemplates: true } as any,
        },
      });

      // Select a row and open the menu (view options can still exist, but index actions should not)
      clickRowCheckboxByName('testy0');
      const manageButton = await screen.findByTestId('indexActionsContextMenuButton');
      fireEvent.click(manageButton);
      await screen.findByTestId('indexContextMenu');

      expect(screen.queryByTestId('showStatsIndexMenuButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('closeIndexMenuButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('forcemergeIndexMenuButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('refreshIndexMenuButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('clearCacheIndexMenuButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('flushIndexMenuButton')).not.toBeInTheDocument();
    });
  });
});
