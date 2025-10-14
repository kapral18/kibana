/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getRouter } from '../../../public/application/services';
import { getRemoteClusterMock } from '../../../fixtures/remote_cluster';

import { PROXY_MODE } from '../../../common/constants';

import { setupEnvironment, getRandomString } from '../helpers';

import { setup } from './remote_clusters_list.helpers';

jest.mock('@elastic/eui/lib/components/search_bar/search_box', () => {
  return {
    EuiSearchBox: (props) => (
      <input
        data-test-subj={props['data-test-subj'] || 'mockSearchBox'}
        onChange={(event) => {
          props.onSearch(event.target.value);
        }}
      />
    ),
  };
});

describe('<RemoteClusterList />', () => {
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  httpRequestsMockHelpers.setLoadRemoteClustersResponse([]);

  describe('on component mount', () => {
    let exists;

    beforeEach(async () => {
      ({ exists } = await setup(httpSetup));
    });

    test('should show a "loading remote clusters" indicator', () => {
      expect(exists('remoteClustersTableLoading')).toBe(true);
    });
  });

  describe('when there are no remote clusters', () => {
    let exists;

    beforeEach(async () => {
      await act(async () => {
        ({ exists } = await setup(httpSetup));
      });
    });

    test('should display an empty prompt', async () => {
      expect(exists('remoteClusterListEmptyPrompt')).toBe(true);
    });

    test('should have a button to create a remote cluster', async () => {
      expect(exists('remoteClusterEmptyPromptCreateButton')).toBe(true);
    });
  });

  describe('can search', () => {
    let table;
    let form;

    const remoteClusters = [
      {
        name: 'simple_remote_cluster',
        seeds: ['127.0.0.1:2000', '127.0.0.2:3000'],
      },
      {
        name: 'remote_cluster_with_proxy',
        proxyAddress: '192.168.0.1:80',
        mode: PROXY_MODE,
      },
    ];

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);

      await act(async () => {
        ({ table, form } = await setup(httpSetup));
      });
    });

    test('without any search params it should show all clusters', () => {
      const { tableCellsValues } = table.getMetaData('remoteClusterListTable');
      expect(tableCellsValues.length).toBe(2);
    });

    test('search by seed works', async () => {
      await form.setInputValue('remoteClusterSearch', 'simple');
      const { tableCellsValues } = table.getMetaData('remoteClusterListTable');
      expect(tableCellsValues.length).toBe(1);
    });

    test('search by proxyAddress works', async () => {
      await form.setInputValue('remoteClusterSearch', 'proxy');
      const { tableCellsValues } = table.getMetaData('remoteClusterListTable');
      expect(tableCellsValues.length).toBe(1);
    });
  });

  describe('when there are multiple pages of remote clusters', () => {
    let table;
    let actions;
    let form;

    const remoteClusters = [
      {
        name: 'unique',
        seeds: [],
      },
    ];

    for (let i = 0; i < 29; i++) {
      if (i % 2 === 0) {
        remoteClusters.push({
          name: `cluster-${i}`,
          seeds: [],
        });
      } else {
        remoteClusters.push({
          name: `cluster_with_proxy-${i}`,
          proxyAddress: `127.0.0.1:10${i}`,
          mode: PROXY_MODE,
        });
      }
    }

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);

      await act(async () => {
        ({ table, actions, form } = await setup(httpSetup));
      });
    });

    test('pagination works', async () => {
      await actions.clickPaginationNextButton();
      const { tableCellsValues } = table.getMetaData('remoteClusterListTable');

      // Pagination defaults to 20 remote clusters per page. We loaded 30 remote clusters,
      // so the second page should have 10.
      expect(tableCellsValues.length).toBe(10);
    });

    test('search works', async () => {
      await form.setInputValue('remoteClusterSearch', 'unique');
      const { tableCellsValues } = table.getMetaData('remoteClusterListTable');
      expect(tableCellsValues.length).toBe(1);
    });
  });

  describe('when there are remote clusters', () => {
    let find;
    let exists;
    let table;
    let actions;
    let tableCellsValues;
    let rows;

    // For deterministic tests, we need to make sure that remoteCluster1 comes before remoteCluster2
    // in the table list that is rendered. As the table orders alphabetically by index name
    // we prefix the random name to make sure that remoteCluster1 name comes before remoteCluster2.
    const remoteCluster1 = getRemoteClusterMock({ name: `a${getRandomString()}` });
    const remoteCluster2 = getRemoteClusterMock({
      name: `b${getRandomString()}`,
      isConnected: false,
      connectedSocketsCount: 0,
      proxyAddress: 'localhost:9500',
      isConfiguredByNode: true,
      mode: PROXY_MODE,
      seeds: null,
      connectedNodesCount: null,
    });
    const remoteCluster3 = getRemoteClusterMock({
      name: `c${getRandomString()}`,
      isConnected: false,
      connectedSocketsCount: 0,
      proxyAddress: 'localhost:9500',
      isConfiguredByNode: false,
      mode: PROXY_MODE,
      hasDeprecatedProxySetting: true,
      seeds: null,
      connectedNodesCount: null,
      securityModel: 'api_keys',
    });

    const remoteClusters = [remoteCluster1, remoteCluster2, remoteCluster3];

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(remoteClusters);

      await act(async () => {
        ({ find, exists, table, actions } = await setup(httpSetup));
      });

      // Read the remote clusters list table
      ({ rows, tableCellsValues } = table.getMetaData('remoteClusterListTable'));
    });

    test('should not display the empty prompt', () => {
      expect(exists('remoteClusterListEmptyPrompt')).toBe(false);
    });

    test('should have a button to create a remote cluster', () => {
      expect(exists('remoteClusterCreateButton')).toBe(true);
    });

    test('should have link to documentation', () => {
      expect(exists('documentationLink')).toBe(true);
    });

    test('should list the remote clusters in the table', () => {
      expect(tableCellsValues.length).toEqual(remoteClusters.length);
      expect(tableCellsValues).toEqual([
        [
          '', // Empty because the first column is the checkbox to select the row
          remoteCluster1.name,
          'Connected',
          'default',
          remoteCluster1.seeds.join(', '),
          'CertificateInfo',
          remoteCluster1.connectedNodesCount.toString(),
          '', // Empty because the last column is for the "actions" on the resource
        ],
        [
          '',
          remoteCluster2.name.concat('Info'), //Tests include the word "info" to account for the rendered text coming from EuiIcon
          'Not connected',
          PROXY_MODE,
          remoteCluster2.proxyAddress,
          'CertificateInfo',
          remoteCluster2.connectedSocketsCount.toString(),
          '',
        ],
        [
          '',
          remoteCluster3.name.concat('Info'), //Tests include the word "info" to account for the rendered text coming from EuiIcon
          'Not connected',
          PROXY_MODE,
          remoteCluster2.proxyAddress,
          'api_keysInfo',
          remoteCluster2.connectedSocketsCount.toString(),
          '',
        ],
      ]);
    });

    test('should have a tooltip to indicate that the cluster has been defined in elasticsearch.yml', () => {
      const secondRow = rows[1].element; // The second cluster has been defined by node
      expect(
        within(secondRow).queryByTestId('remoteClustersTableListClusterDefinedByNodeTooltip')
      ).toBeInTheDocument();
    });

    test('should have a tooltip to indicate that the cluster has a deprecated setting', () => {
      const thirdRow = rows[2].element; // The third cluster has been defined with deprecated setting
      expect(
        within(thirdRow).queryByTestId('remoteClustersTableListClusterWithDeprecatedSettingTooltip')
      ).toBeInTheDocument();
    });

    test('should have a tooltip to indicate that the cluster is using an old security model', () => {
      const secondRow = rows[1].element;
      expect(within(secondRow).queryByTestId('authenticationTypeWarning')).toBeInTheDocument();
    });

    describe('bulk delete button', () => {
      test('should be visible when a remote cluster is selected', async () => {
        expect(exists('remoteClusterBulkDeleteButton')).toBe(false);

        await actions.selectRemoteClusterAt(0);

        expect(exists('remoteClusterBulkDeleteButton')).toBe(true);
      });

      // TODO: Fix this test - the second checkbox selection isn't updating the button label
      test.skip('should update the button label if more than 1 remote cluster is selected', async () => {
        await actions.selectRemoteClusterAt(0);

        let button = find('remoteClusterBulkDeleteButton');
        expect(button.textContent).toEqual('Remove remote cluster');

        await actions.selectRemoteClusterAt(1);

        // Re-query the button - RTL automatically waits for updates
        button = find('remoteClusterBulkDeleteButton');
        expect(button.textContent).toEqual('Remove 2 remote clusters');
      });

      test('should open a confirmation modal when clicking on it', async () => {
        expect(exists('remoteClustersDeleteConfirmModal')).toBe(false);

        await actions.selectRemoteClusterAt(0);
        await actions.clickBulkDeleteButton();

        expect(exists('remoteClustersDeleteConfirmModal')).toBe(true);
      });
    });

    describe('table row actions', () => {
      test('should have a "delete" and an "edit" action button on each row', () => {
        const indexLastColumn = rows[0].columns.length - 1;
        const tableCellActions = rows[0].columns[indexLastColumn].element;

        const deleteButton = within(tableCellActions).queryByTestId(
          'remoteClusterTableRowRemoveButton'
        );
        const editButton = within(tableCellActions).queryByTestId(
          'remoteClusterTableRowEditButton'
        );

        expect(deleteButton).toBeInTheDocument();
        expect(editButton).toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking on "delete" button', async () => {
        expect(exists('remoteClustersDeleteConfirmModal')).toBe(false);

        await actions.clickRowActionButtonAt(0, 'delete');

        expect(exists('remoteClustersDeleteConfirmModal')).toBe(true);
      });
    });

    describe('confirmation modal (delete remote cluster)', () => {
      test('should remove the remote cluster from the table after delete is successful', async () => {
        // Mock HTTP DELETE request
        httpRequestsMockHelpers.setDeleteRemoteClusterResponse(remoteCluster1.name, {
          itemsDeleted: [remoteCluster1.name],
          errors: [],
        });

        // Make sure that we have our 3 remote clusters in the table
        expect(rows.length).toBe(3);

        await actions.selectRemoteClusterAt(0);
        await actions.clickBulkDeleteButton();
        await actions.clickConfirmModalDeleteRemoteCluster();

        await act(async () => {
          jest.advanceTimersByTime(600); // there is a 500ms timeout in the api action
        });

        ({ rows } = table.getMetaData('remoteClusterListTable'));

        expect(rows.length).toBe(2);
        expect(rows[0].columns[1].value).toContain(remoteCluster2.name);
      });
    });

    describe('detail panel', () => {
      test('should open a detail panel when clicking on a remote cluster', async () => {
        expect(exists('remoteClusterDetailFlyout')).toBe(false);

        await actions.clickRemoteClusterAt(0);

        expect(exists('remoteClusterDetailFlyout')).toBe(true);
      });

      test('should set the title to the remote cluster selected', async () => {
        await actions.clickRemoteClusterAt(0); // Select remote cluster and open the detail panel
        expect(find('remoteClusterDetailsFlyoutTitle').textContent).toEqual(remoteCluster1.name);
      });

      test('should have a "Status" section', async () => {
        await actions.clickRemoteClusterAt(0);
        const statusSection = find('remoteClusterDetailPanelStatusSection');
        expect(within(statusSection).getByRole('heading', { level: 3 }).textContent).toEqual(
          'Status'
        );
        expect(exists('remoteClusterDetailPanelStatusValues')).toBe(true);
      });

      test('should set the correct remote cluster status values', async () => {
        await actions.clickRemoteClusterAt(0);

        expect(find('remoteClusterDetailIsConnected').textContent).toEqual('Connected');
        expect(find('remoteClusterDetailConnectedNodesCount').textContent).toEqual(
          remoteCluster1.connectedNodesCount.toString()
        );
        expect(find('remoteClusterDetailSeeds').textContent).toEqual(
          remoteCluster1.seeds.join(' ')
        );
        expect(find('remoteClusterDetailSkipUnavailable').textContent).toEqual('No');
        expect(find('remoteClusterDetailMaxConnections').textContent).toEqual(
          remoteCluster1.maxConnectionsPerCluster.toString()
        );
        expect(find('remoteClusterDetailInitialConnectTimeout').textContent).toEqual(
          remoteCluster1.initialConnectTimeout
        );
      });

      test('should have a "close", "delete" and "edit" button in the footer', async () => {
        await actions.clickRemoteClusterAt(0);
        expect(exists('remoteClusterDetailsPanelCloseButton')).toBe(true);
        expect(exists('remoteClusterDetailPanelRemoveButton')).toBe(true);
        expect(exists('remoteClusterDetailPanelEditButton')).toBe(true);
      });

      test('should close the detail panel when clicking the "close" button', async () => {
        await actions.clickRemoteClusterAt(0); // open the detail panel
        expect(exists('remoteClusterDetailFlyout')).toBe(true);

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await act(async () => {
          await user.click(find('remoteClusterDetailsPanelCloseButton'));
        });

        expect(exists('remoteClusterDetailFlyout')).toBe(false);
      });

      test('should open a confirmation modal when clicking the "delete" button', async () => {
        await actions.clickRemoteClusterAt(0);
        expect(exists('remoteClustersDeleteConfirmModal')).toBe(false);

        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await act(async () => {
          await user.click(find('remoteClusterDetailPanelRemoveButton'));
        });

        expect(exists('remoteClustersDeleteConfirmModal')).toBe(true);
      });

      test('should display a "Remote cluster not found" when providing a wrong cluster name', async () => {
        expect(exists('remoteClusterDetailFlyout')).toBe(false);

        await act(async () => {
          getRouter().history.replace({ search: `?cluster=wrong-cluster` });
        });

        expect(exists('remoteClusterDetailFlyout')).toBe(true);
        expect(exists('remoteClusterDetailClusterNotFound')).toBe(true);
      });

      test('should display a warning when the cluster is configured by node', async () => {
        await actions.clickRemoteClusterAt(0); // the remoteCluster1 has *not* been configured by node
        expect(exists('remoteClusterConfiguredByNodeWarning')).toBe(false);

        await actions.clickRemoteClusterAt(1); // the remoteCluster2 has been configured by node
        expect(exists('remoteClusterConfiguredByNodeWarning')).toBe(true);
      });

      test('Should display authentication type', async () => {
        await actions.clickRemoteClusterAt(2);
        expect(exists('remoteClusterDetailAuthType')).toBe(true);
      });
    });
  });
});
