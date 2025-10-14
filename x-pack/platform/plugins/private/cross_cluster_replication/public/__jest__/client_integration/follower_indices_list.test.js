/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { screen, act } from '@testing-library/react';

import './mocks';
import { getFollowerIndexMock } from './fixtures/follower_index';
import { setupEnvironment, pageHelpers, getRandomString } from './helpers';

const { setup } = pageHelpers.followerIndexList;

describe('<FollowerIndicesList />', () => {
  let httpRequestsMockHelpers;

  beforeAll(() => {
    jest.useFakeTimers();
    ({ httpRequestsMockHelpers } = setupEnvironment());
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set "default" mock responses by not providing any arguments
    httpRequestsMockHelpers.setLoadFollowerIndicesResponse();
  });

  describe('on component mount', () => {
    beforeEach(() => {
      setup();
    });

    test('should show a loading indicator on component', () => {
      expect(screen.getByTestId('sectionLoading')).toBeInTheDocument();
    });
  });

  describe('when there are no follower indices', () => {
    beforeEach(async () => {
      await act(async () => {
        setup();
        await jest.runAllTimersAsync();
      });
    });

    test('should display an empty prompt', () => {
      expect(screen.getByTestId('emptyPrompt')).toBeInTheDocument();
    });

    test('should have a button to create a follower index', () => {
      expect(screen.getByTestId('emptyPrompt.createFollowerIndexButton')).toBeInTheDocument();
    });
  });

  describe('when there are multiple pages of follower indices', () => {
    let table;
    let actions;
    let form;

    const followerIndices = [
      {
        name: 'unique',
        seeds: [],
      },
    ];

    for (let i = 0; i < 29; i++) {
      followerIndices.push({
        name: `name${i}`,
        seeds: [],
      });
    }

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadFollowerIndicesResponse({ indices: followerIndices });

      await act(async () => {
        ({ table, actions, form } = setup());
        await jest.runAllTimersAsync();
      });
    });

    test('pagination works', () => {
      actions.clickPaginationNextButton();
      const { tableCellsValues } = table.getMetaData('followerIndexListTable');

      // Pagination defaults to 20 follower indices per page. We loaded 30 follower indices,
      // so the second page should have 10.
      expect(tableCellsValues.length).toBe(10);
    });

    test('search works', () => {
      form.setInputValue('followerIndexSearch', 'unique');
      const { tableCellsValues } = table.getMetaData('followerIndexListTable');
      expect(tableCellsValues.length).toBe(1);
    });
  });

  describe('when there are follower indices', () => {
    let table;
    let actions;
    let tableCellsValues;

    // For deterministic tests, we need to make sure that index1 comes before index2
    // in the table list that is rendered. As the table orders alphabetically by index name
    // we prefix the random name to make sure that index1 name comes before index2.
    const index1 = getFollowerIndexMock({ name: `a${getRandomString()}` });
    const index2 = getFollowerIndexMock({ name: `b${getRandomString()}`, status: 'paused' });

    const followerIndices = [index1, index2];

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadFollowerIndicesResponse({ indices: followerIndices });

      // Mount the component
      await act(async () => {
        ({ table, actions } = setup());
        await jest.runAllTimersAsync();
      });

      // Read the index list table
      ({ tableCellsValues } = table.getMetaData('followerIndexListTable'));
    });

    test('should not display the empty prompt', () => {
      expect(screen.queryByTestId('emptyPrompt')).not.toBeInTheDocument();
    });

    test('should have a button to create a follower index', () => {
      expect(screen.getByTestId('createFollowerIndexButton')).toBeInTheDocument();
    });

    test('should list the follower indices in the table', () => {
      expect(tableCellsValues.length).toEqual(followerIndices.length);
      expect(tableCellsValues).toEqual([
        [
          '', // Empty because the first column is the checkbox to select row
          index1.name,
          'Active',
          index1.remoteCluster,
          index1.leaderIndex,
          '', // Empty because the last column is for the "actions" on the resource
        ],
        ['', index2.name, 'Paused', index2.remoteCluster, index2.leaderIndex, ''],
      ]);
    });

    describe('action menu', () => {
      test('should be visible when a follower index is selected', () => {
        expect(screen.queryByTestId('contextMenuButton')).not.toBeInTheDocument();

        actions.selectFollowerIndexAt(0);

        expect(screen.getByTestId('contextMenuButton')).toBeInTheDocument();
      });

      test('should have a "pause", "edit" and "unfollow" action when the follower index is active', () => {
        actions.selectFollowerIndexAt(0);
        actions.openContextMenu();

        const contextMenu = screen.getByTestId('contextMenu');
        const buttons = contextMenu.querySelectorAll('button');
        const buttonsLabel = Array.from(buttons).map((btn) => btn.textContent);

        expect(buttonsLabel).toEqual([
          'Pause replication',
          'Edit follower index',
          'Unfollow leader index',
        ]);
      });

      test('should have a "resume", "edit" and "unfollow" action when the follower index is active', () => {
        actions.selectFollowerIndexAt(1); // Select the second follower that is "paused"
        actions.openContextMenu();

        const contextMenu = screen.getByTestId('contextMenu');
        const buttons = contextMenu.querySelectorAll('button');
        const buttonsLabel = Array.from(buttons).map((btn) => btn.textContent);
        
        expect(buttonsLabel).toEqual([
          'Resume replication',
          'Edit follower index',
          'Unfollow leader index',
        ]);
      });

      test('should open a confirmation modal when clicking on "pause replication"', () => {
        expect(screen.queryByTestId('pauseReplicationConfirmation')).not.toBeInTheDocument();

        actions.selectFollowerIndexAt(0);
        actions.openContextMenu();
        actions.clickContextMenuButtonAt(0); // first button is the "pause" action

        expect(screen.getByTestId('pauseReplicationConfirmation')).toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking on "unfollow leader index"', () => {
        expect(screen.queryByTestId('unfollowLeaderConfirmation')).not.toBeInTheDocument();

        actions.selectFollowerIndexAt(0);
        actions.openContextMenu();
        actions.clickContextMenuButtonAt(2); // third button is the "unfollow" action

        expect(screen.getByTestId('unfollowLeaderConfirmation')).toBeInTheDocument();
      });
    });

    describe('table row action menu', () => {
      test('should open a context menu when clicking on the button of each row', () => {
        expect(document.querySelectorAll('div.euiContextMenuPanel').length).toBe(0);

        actions.openTableRowContextMenuAt(0);

        expect(document.querySelectorAll('div.euiContextMenuPanel').length).toBe(1);
      });

      test('should have the "pause", "edit" and "unfollow" options in the row context menu', () => {
        actions.openTableRowContextMenuAt(0);

        const panel = document.querySelector('div.euiContextMenuPanel');
        const buttons = panel.querySelectorAll('button.euiContextMenuItem');
        const buttonLabels = Array.from(buttons).map((button) => button.textContent);

        expect(buttonLabels).toEqual([
          'Pause replication',
          'Edit follower index',
          'Unfollow leader index',
        ]);
      });

      test('should have the "resume", "edit" and "unfollow" options in the row context menu', () => {
        // We open the context menu of the second row (index 1) as followerIndices[1].status is "paused"
        actions.openTableRowContextMenuAt(1);

        const panel = document.querySelector('div.euiContextMenuPanel');
        const buttons = panel.querySelectorAll('button.euiContextMenuItem');
        const buttonLabels = Array.from(buttons).map((button) => button.textContent);

        expect(buttonLabels).toEqual([
          'Resume replication',
          'Edit follower index',
          'Unfollow leader index',
        ]);
      });

      test('should open a confirmation modal when clicking on "pause replication"', () => {
        expect(screen.queryByTestId('pauseReplicationConfirmation')).not.toBeInTheDocument();

        actions.openTableRowContextMenuAt(0);

        const pauseButton = screen.getByTestId('pauseButton');
        pauseButton.click();

        expect(screen.getByTestId('pauseReplicationConfirmation')).toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking on "resume"', () => {
        expect(screen.queryByTestId('resumeReplicationConfirmation')).not.toBeInTheDocument();

        actions.openTableRowContextMenuAt(1); // open the second row context menu, as it is a "paused" follower index

        const resumeButton = screen.getByTestId('resumeButton');
        resumeButton.click();

        expect(screen.getByTestId('resumeReplicationConfirmation')).toBeInTheDocument();
      });

      test('should open a confirmation modal when clicking on "unfollow leader index"', () => {
        expect(screen.queryByTestId('unfollowLeaderConfirmation')).not.toBeInTheDocument();

        actions.openTableRowContextMenuAt(0);

        const unfollowButton = screen.getByTestId('unfollowButton');
        unfollowButton.click();

        expect(screen.getByTestId('unfollowLeaderConfirmation')).toBeInTheDocument();
      });
    });

    // FLAKY: https://github.com/elastic/kibana/issues/142774
    describe.skip('detail panel', () => {
      test('should open a detail panel when clicking on a follower index', () => {
        expect(screen.queryByTestId('followerIndexDetail')).not.toBeInTheDocument();

        actions.clickFollowerIndexAt(0);

        expect(screen.getByTestId('followerIndexDetail')).toBeInTheDocument();
      });

      test('should set the title the index that has been selected', () => {
        actions.clickFollowerIndexAt(0); // Open the detail panel
        expect(screen.getByTestId('followerIndexDetail.title')).toHaveTextContent(index1.name);
      });

      test('should indicate the correct "status", "remote cluster" and "leader index"', () => {
        actions.clickFollowerIndexAt(0);
        expect(screen.getByTestId('followerIndexDetail.status')).toHaveTextContent(index1.status);
        expect(screen.getByTestId('followerIndexDetail.remoteCluster')).toHaveTextContent(index1.remoteCluster);
        expect(screen.getByTestId('followerIndexDetail.leaderIndex')).toHaveTextContent(index1.leaderIndex);
      });

      test('should have a "settings" section', () => {
        actions.clickFollowerIndexAt(0);
        const settingsSection = screen.getByTestId('followerIndexDetail.settingsSection');
        expect(settingsSection.querySelector('h3')).toHaveTextContent('Settings');
        expect(screen.queryByTestId('followerIndexDetail.settingsValues')).toBeInTheDocument();
      });

      test('should set the correct follower index settings values', () => {
        const mapSettingsToFollowerIndexProp = {
          maxReadReqOpCount: 'maxReadRequestOperationCount',
          maxOutstandingReadReq: 'maxOutstandingReadRequests',
          maxReadReqSize: 'maxReadRequestSize',
          maxWriteReqOpCount: 'maxWriteRequestOperationCount',
          maxWriteReqSize: 'maxWriteRequestSize',
          maxOutstandingWriteReq: 'maxOutstandingWriteRequests',
          maxWriteBufferCount: 'maxWriteBufferCount',
          maxWriteBufferSize: 'maxWriteBufferSize',
          maxRetryDelay: 'maxRetryDelay',
          readPollTimeout: 'readPollTimeout',
        };

        actions.clickFollowerIndexAt(0);

        Object.entries(mapSettingsToFollowerIndexProp).forEach(([setting, prop]) => {
          const element = screen.queryByTestId(`settingsValues.${setting}`);

          if (!element) {
            throw new Error(`Could not find description for setting "${setting}"`);
          }

          expect(element).toHaveTextContent(index1[prop].toString());
        });
      });

      test('should not have settings values for a "paused" follower index', () => {
        actions.clickFollowerIndexAt(1); // the second follower index is paused
        expect(screen.queryByTestId('followerIndexDetail.settingsValues')).not.toBeInTheDocument();
        expect(screen.getByTestId('followerIndexDetail.settingsSection')).toHaveTextContent(
          'paused follower index does not have settings'
        );
      });

      // FLAKY: https://github.com/elastic/kibana/issues/100951
      test.skip('should have a section to render the follower index shards stats', () => {
        actions.clickFollowerIndexAt(0);
        expect(screen.getByTestId('followerIndexDetail.shardsStatsSection')).toBeInTheDocument();

        const codeBlocks = screen.getAllByTestId('shardsStats');

        expect(codeBlocks.length).toBe(index1.shards.length);
        codeBlocks.forEach((codeBlock, i) => {
          expect(JSON.parse(codeBlock.props().children)).toEqual(index1.shards[i]);
        });
      });
    });
  });
});
