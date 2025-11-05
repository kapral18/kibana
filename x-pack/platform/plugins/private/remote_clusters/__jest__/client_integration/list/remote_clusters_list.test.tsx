/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';

import { getRouter } from '../../../public/application/services';
import { getRemoteClusterMock } from '../../../fixtures/remote_cluster';

import { PROXY_MODE } from '../../../common/constants';

import { setupEnvironment, getRandomString } from '../helpers';

import type { RemoteClusterListTestBed } from './remote_clusters_list.helpers';
import { setup } from './remote_clusters_list.helpers';

jest.mock('@elastic/eui/lib/components/search_bar/search_box', () => {
  return {
    EuiSearchBox: (props: any) => (
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
  let testBed: RemoteClusterListTestBed;
  const { httpSetup, httpRequestsMockHelpers } = setupEnvironment();

  beforeAll(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    httpRequestsMockHelpers.setLoadRemoteClustersResponse([]);
  });

  describe('on component mount', () => {
    beforeEach(async () => {
      testBed = await setup(httpSetup);
    });

    test('should show a "loading remote clusters" indicator', () => {
      expect(screen.queryByTestId('remoteClustersTableLoading')).toBeInTheDocument();
    });
  });

  describe('when there are no remote clusters', () => {
    beforeEach(async () => {
      testBed = await setup(httpSetup);
      await waitFor(() => {
        expect(screen.queryByTestId('remoteClustersTableLoading')).not.toBeInTheDocument();
      });
    });

    test('should display an empty prompt', () => {
      expect(screen.getByTestId('remoteClusterListEmptyPrompt')).toBeInTheDocument();
    });

    test('should have a button to create a remote cluster', () => {
      expect(screen.getByTestId('remoteClusterEmptyPromptCreateButton')).toBeInTheDocument();
    });
  });

  describe('can search', () => {
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
      testBed = await setup(httpSetup);
      await waitFor(() => {
        expect(screen.queryByTestId('remoteClustersTableLoading')).not.toBeInTheDocument();
      });
    });

    test('without any search params it should show all clusters', () => {
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      // Subtract 1 for header row
      expect(rows.length - 1).toBe(2);
    });

    test('search by seed works', async () => {
      const searchBox = screen.getByTestId('remoteClusterSearch');
      await testBed.user.type(searchBox, 'simple');
      
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      expect(rows.length - 1).toBe(1);
    });

    test('search by proxyAddress works', async () => {
      const searchBox = screen.getByTestId('remoteClusterSearch');
      await testBed.user.type(searchBox, 'proxy');
      
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      expect(rows.length - 1).toBe(1);
    });
  });

  describe('when there are multiple pages of remote clusters', () => {
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
      testBed = await setup(httpSetup);
      await waitFor(() => {
        expect(screen.queryByTestId('remoteClustersTableLoading')).not.toBeInTheDocument();
      });
    });

    test('pagination works', async () => {
      await testBed.actions.clickPaginationNextButton();
      
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      // Pagination defaults to 20 remote clusters per page. We loaded 30 remote clusters,
      // so the second page should have 10.
      expect(rows.length - 1).toBe(10);
    });

    test('search works', async () => {
      const searchBox = screen.getByTestId('remoteClusterSearch');
      await testBed.user.type(searchBox, 'unique');
      
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      expect(rows.length - 1).toBe(1);
    });
  });

  describe('when there are remote clusters', () => {
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
      testBed = await setup(httpSetup);
      await waitFor(() => {
        expect(screen.queryByTestId('remoteClustersTableLoading')).not.toBeInTheDocument();
      });
    });

    test('should not display the empty prompt', () => {
      expect(screen.queryByTestId('remoteClusterListEmptyPrompt')).not.toBeInTheDocument();
    });

    test('should have a button to create a remote cluster', () => {
      expect(screen.getByTestId('remoteClusterCreateButton')).toBeInTheDocument();
    });

    test('should have link to documentation', () => {
      expect(screen.getByTestId('documentationLink')).toBeInTheDocument();
    });

    test('should list the remote clusters in the table', () => {
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      
      // Subtract 1 for header row
      expect(rows.length - 1).toEqual(remoteClusters.length);
      
      // Check first cluster
      expect(within(rows[1]).getByText(remoteCluster1.name)).toBeInTheDocument();
      expect(within(rows[1]).getByText('Connected')).toBeInTheDocument();
      expect(within(rows[1]).getByText('default')).toBeInTheDocument();
      expect(within(rows[1]).getByText(remoteCluster1.seeds!.join(', '))).toBeInTheDocument();
      
      // Check second cluster
      expect(within(rows[2]).getByText(remoteCluster2.name)).toBeInTheDocument();
      expect(within(rows[2]).getByText('Not connected')).toBeInTheDocument();
      expect(within(rows[2]).getByText(PROXY_MODE)).toBeInTheDocument();
      expect(within(rows[2]).getByText(remoteCluster2.proxyAddress!)).toBeInTheDocument();
      
      // Check third cluster
      expect(within(rows[3]).getByText(remoteCluster3.name)).toBeInTheDocument();
      expect(within(rows[3]).getByText('Not connected')).toBeInTheDocument();
    });

    test('should have a tooltip to indicate that the cluster has been defined in elasticsearch.yml', () => {
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      const secondRow = rows[2]; // The second cluster has been defined by node
      expect(
        within(secondRow).getByTestId('remoteClustersTableListClusterDefinedByNodeTooltip')
      ).toBeInTheDocument();
    });

    test('should have a tooltip to indicate that the cluster has a deprecated setting', () => {
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      const thirdRow = rows[3]; // The third cluster has been defined with deprecated setting
      expect(
        within(thirdRow).getByTestId('remoteClustersTableListClusterWithDeprecatedSettingTooltip')
      ).toBeInTheDocument();
    });

    test('should have a tooltip to indicate that the cluster is using an old security model', () => {
      const table = screen.getByTestId('remoteClusterListTable');
      const rows = within(table).getAllByRole('row');
      const secondRow = rows[2];
      expect(within(secondRow).getByTestId('authenticationTypeWarning')).toBeInTheDocument();
    });

    describe('bulk delete button', () => {
      test('should be visible when a remote cluster is selected', async () => {
        expect(screen.queryByTestId('remoteClusterBulkDeleteButton')).not.toBeInTheDocument();

        await testBed.actions.selectRemoteClusterAt(0);

        expect(screen.getByTestId('remoteClusterBulkDeleteButton')).toBeInTheDocument();
      });

      test('should update the button label if more than 1 remote cluster is selected', async () => {
        await testBed.actions.selectRemoteClusterAt(0);

        let button = screen.getByTestId('remoteClusterBulkDeleteButton');
        expect(button.textContent).toEqual('Remove remote cluster');

        await testBed.actions.selectRemoteClusterAt(1);
        button = screen.getByTestId('remoteClusterBulkDeleteButton');
        expect(button.textContent).toEqual('Remove 2 remote clusters');
      });

      test('should open a confirmation modal when clicking on it', async () => {
        expect(screen.queryByTestId('remoteClustersDeleteConfirmModal')).not.toBeInTheDocument();

        await testBed.actions.selectRemoteClusterAt(0);
        await testBed.actions.clickBulkDeleteButton();

        expect(screen.getByTestId('remoteClustersDeleteConfirmModal')).toBeInTheDocument();
      });
    });

    describe('table row actions', () => {
      test('should have a "delete" and an "edit" action button on each row', () => {
        const table = screen.getByTestId('remoteClusterListTable');
        const rows = within(table).getAllByRole('row');
        const firstDataRow = rows[1];

        const deleteButton = within(firstDataRow).getByTestId('remoteClusterTableRowRemoveButton');
        const editButton = within(firstDataRow).getByTestId('remoteClusterTableRowEditButton');

        expect(deleteButton).toBeInTheDocument();
        expect(editButton).toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking on "delete" button', async () => {
        expect(screen.queryByTestId('remoteClustersDeleteConfirmModal')).not.toBeInTheDocument();

        await testBed.actions.clickRowActionButtonAt(0, 'delete');

        expect(screen.getByTestId('remoteClustersDeleteConfirmModal')).toBeInTheDocument();
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
        let table = screen.getByTestId('remoteClusterListTable');
        let rows = within(table).getAllByRole('row');
        expect(rows.length - 1).toBe(3);

        await testBed.actions.selectRemoteClusterAt(0);
        await testBed.actions.clickBulkDeleteButton();
        await testBed.actions.clickConfirmModalDeleteRemoteCluster();

        await waitFor(() => {
          // there is a 500ms timeout in the api action
          jest.advanceTimersByTime(600);
        });

        await waitFor(() => {
          table = screen.getByTestId('remoteClusterListTable');
          rows = within(table).getAllByRole('row');
          expect(rows.length - 1).toBe(2);
          expect(within(rows[1]).getByText(remoteCluster2.name)).toBeInTheDocument();
        });
      });
    });

    describe('detail panel', () => {
      test('should open a detail panel when clicking on a remote cluster', async () => {
        expect(screen.queryByTestId('remoteClusterDetailFlyout')).not.toBeInTheDocument();

        await testBed.actions.clickRemoteClusterAt(0);

        expect(screen.getByTestId('remoteClusterDetailFlyout')).toBeInTheDocument();
      });

      test('should set the title to the remote cluster selected', async () => {
        await testBed.actions.clickRemoteClusterAt(0); // Select remote cluster and open the detail panel
        expect(screen.getByTestId('remoteClusterDetailsFlyoutTitle').textContent).toEqual(
          remoteCluster1.name
        );
      });

      test('should have a "Status" section', async () => {
        await testBed.actions.clickRemoteClusterAt(0);
        const statusSection = screen.getByTestId('remoteClusterDetailPanelStatusSection');
        expect(within(statusSection).getByText('Status')).toBeInTheDocument();
        expect(screen.getByTestId('remoteClusterDetailPanelStatusValues')).toBeInTheDocument();
      });

      test('should set the correct remote cluster status values', async () => {
        await testBed.actions.clickRemoteClusterAt(0);

        expect(screen.getByTestId('remoteClusterDetailIsConnected').textContent).toEqual(
          'Connected'
        );
        expect(screen.getByTestId('remoteClusterDetailConnectedNodesCount').textContent).toEqual(
          remoteCluster1.connectedNodesCount!.toString()
        );
        expect(screen.getByTestId('remoteClusterDetailSeeds').textContent).toEqual(
          remoteCluster1.seeds!.join(' ')
        );
        expect(screen.getByTestId('remoteClusterDetailSkipUnavailable').textContent).toEqual('No');
        expect(screen.getByTestId('remoteClusterDetailMaxConnections').textContent).toEqual(
          remoteCluster1.maxConnectionsPerCluster.toString()
        );
        expect(
          screen.getByTestId('remoteClusterDetailInitialConnectTimeout').textContent
        ).toEqual(remoteCluster1.initialConnectTimeout);
      });

      test('should have a "close", "delete" and "edit" button in the footer', async () => {
        await testBed.actions.clickRemoteClusterAt(0);
        expect(screen.getByTestId('remoteClusterDetailsPanelCloseButton')).toBeInTheDocument();
        expect(screen.getByTestId('remoteClusterDetailPanelRemoveButton')).toBeInTheDocument();
        expect(screen.getByTestId('remoteClusterDetailPanelEditButton')).toBeInTheDocument();
      });

      test('should close the detail panel when clicking the "close" button', async () => {
        await testBed.actions.clickRemoteClusterAt(0); // open the detail panel
        expect(screen.getByTestId('remoteClusterDetailFlyout')).toBeInTheDocument();

        const closeButton = screen.getByTestId('remoteClusterDetailsPanelCloseButton');
        await testBed.user.click(closeButton);

        expect(screen.queryByTestId('remoteClusterDetailFlyout')).not.toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking the "delete" button', async () => {
        await testBed.actions.clickRemoteClusterAt(0);
        expect(screen.queryByTestId('remoteClustersDeleteConfirmModal')).not.toBeInTheDocument();

        const deleteButton = screen.getByTestId('remoteClusterDetailPanelRemoveButton');
        await testBed.user.click(deleteButton);

        expect(screen.getByTestId('remoteClustersDeleteConfirmModal')).toBeInTheDocument();
      });

      test('should display a "Remote cluster not found" when providing a wrong cluster name', async () => {
        expect(screen.queryByTestId('remoteClusterDetailFlyout')).not.toBeInTheDocument();

        getRouter().history.replace({ search: `?cluster=wrong-cluster` });
        
        await waitFor(() => {
          expect(screen.getByTestId('remoteClusterDetailFlyout')).toBeInTheDocument();
          expect(screen.getByTestId('remoteClusterDetailClusterNotFound')).toBeInTheDocument();
        });
      });

      test('should display a warning when the cluster is configured by node', async () => {
        await testBed.actions.clickRemoteClusterAt(0); // the remoteCluster1 has *not* been configured by node
        expect(
          screen.queryByTestId('remoteClusterConfiguredByNodeWarning')
        ).not.toBeInTheDocument();

        await testBed.actions.clickRemoteClusterAt(1); // the remoteCluster2 has been configured by node
        expect(screen.getByTestId('remoteClusterConfiguredByNodeWarning')).toBeInTheDocument();
      });

      test('Should display authentication type', async () => {
        await testBed.actions.clickRemoteClusterAt(2);
        expect(screen.getByTestId('remoteClusterDetailAuthType')).toBeInTheDocument();
      });
    });
  });
});
