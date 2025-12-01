/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

import { ReindexStep } from '@kbn/reindex-service-plugin/common';
import { ReindexStatus } from '@kbn/upgrade-assistant-pkg-common';
import { LoadingState } from '../../../../../../types';
import type { ReindexState } from '../../../use_reindex';
import { ReindexProgress } from './progress';

describe('ReindexProgress', () => {
  it('renders', () => {
    const { container } = renderWithI18n(
      <ReindexProgress
        reindexState={
          {
            lastCompletedStep: ReindexStep.created,
            status: ReindexStatus.inProgress,
            reindexTaskPercComplete: null,
            errorMessage: null,
            loadingState: LoadingState.Success,
            meta: {
              indexName: 'foo',
              reindexName: 'reindexed-foo',
              aliases: [],
              isFrozen: false,
              isReadonly: false,
              isInDataStream: false,
              isClosedIndex: false,
              isFollowerIndex: false,
            },
          } as ReindexState
        }
        cancelReindex={jest.fn()}
      />
    );

    expect(screen.getByTestId('reindexChecklistTitle')).toBeInTheDocument();
    expect(screen.getByText(/Reindexing in progress/i)).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="reindexChecklistTitle"]')).toMatchSnapshot();
  });

  it('displays errors in the step that failed', () => {
    renderWithI18n(
      <ReindexProgress
        reindexState={
          {
            lastCompletedStep: ReindexStep.reindexCompleted,
            status: ReindexStatus.failed,
            reindexTaskPercComplete: 1,
            errorMessage: `This is an error that happened on alias switch`,
            loadingState: LoadingState.Success,
            meta: {
              indexName: 'foo',
              reindexName: 'reindexed-foo',
              aliases: [],
              isFrozen: true,
              isReadonly: false,
              isInDataStream: false,
              isClosedIndex: false,
              isFollowerIndex: false,
            },
          } as ReindexState
        }
        cancelReindex={jest.fn()}
      />
    );
    
    expect(screen.getByText('This is an error that happened on alias switch')).toBeInTheDocument();
  });
});
