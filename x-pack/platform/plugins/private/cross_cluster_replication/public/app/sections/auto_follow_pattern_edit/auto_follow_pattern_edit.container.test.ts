/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

jest.mock('../../store/actions', () => ({
  getAutoFollowPattern: jest.fn(() => ({ type: 'MOCK/GET_AUTO_FOLLOW_PATTERN' })),
  saveAutoFollowPattern: jest.fn(() => ({ type: 'MOCK/SAVE_AUTO_FOLLOW_PATTERN' })),
  selectEditAutoFollowPattern: jest.fn(() => ({ type: 'MOCK/SELECT_EDIT_AUTO_FOLLOW_PATTERN' })),
  clearApiError: jest.fn((scope: string) => ({ type: 'MOCK/CLEAR_API_ERROR', payload: scope })),
}));

import { mapDispatchToProps } from './auto_follow_pattern_edit.container';
import {
  saveAutoFollowPattern,
  clearApiError,
  selectEditAutoFollowPattern,
  getAutoFollowPattern,
} from '../../store/actions';

const mockedSaveAutoFollowPattern = jest.mocked(saveAutoFollowPattern);
const mockedClearApiError = jest.mocked(clearApiError);
const mockedSelectEditAutoFollowPattern = jest.mocked(selectEditAutoFollowPattern);
const mockedGetAutoFollowPattern = jest.mocked(getAutoFollowPattern);

describe('auto_follow_pattern_edit.container mapDispatchToProps', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    dispatch.mockClear();
    mockedSaveAutoFollowPattern.mockClear();
    mockedClearApiError.mockClear();
    mockedSelectEditAutoFollowPattern.mockClear();
    mockedGetAutoFollowPattern.mockClear();
  });

  describe('saveAutoFollowPattern', () => {
    it('should strip unknown fields from the update payload (defense-in-depth against strict backend schema)', () => {
      const actions = mapDispatchToProps(dispatch);

      // Upstream sources of the pattern object (selectors, reducers, caller
      // code) may include extra fields such as `name` or `errors`. The backend
      // update route rejects unknown fields via
      // `schema.object({...}).unknowns: 'forbid'` (default), so the container
      // must not forward anything outside the documented contract.
      const enrichedPayload = {
        active: true,
        remoteCluster: 'cluster-a',
        leaderIndexPatterns: ['logs-*'],
        followIndexPattern: 'replica-{{leader_index}}',
        name: 'should-not-leak',
        errors: ['should-not-leak'],
        unexpected: 42,
      } as unknown as Parameters<ReturnType<typeof mapDispatchToProps>['saveAutoFollowPattern']>[1];

      actions.saveAutoFollowPattern('my-pattern', enrichedPayload);

      expect(mockedSaveAutoFollowPattern).toHaveBeenCalledTimes(1);
      expect(mockedSaveAutoFollowPattern).toHaveBeenCalledWith(
        'my-pattern',
        {
          active: true,
          remoteCluster: 'cluster-a',
          leaderIndexPatterns: ['logs-*'],
          followIndexPattern: 'replica-{{leader_index}}',
        },
        true
      );
    });

    it('should pass isUpdating=true to the save action', () => {
      const actions = mapDispatchToProps(dispatch);

      actions.saveAutoFollowPattern('my-pattern', {
        active: true,
        remoteCluster: 'cluster-a',
        leaderIndexPatterns: ['logs-*'],
        followIndexPattern: 'replica-{{leader_index}}',
      });

      const [, , isUpdating] = mockedSaveAutoFollowPattern.mock.calls[0];
      expect(isUpdating).toBe(true);
    });
  });

  describe('clearApiError', () => {
    it('should clear both the -get and -save scopes', () => {
      const actions = mapDispatchToProps(dispatch);
      actions.clearApiError();

      const calledScopes = mockedClearApiError.mock.calls.map(([scope]) => scope);
      expect(calledScopes).toEqual(
        expect.arrayContaining(['autoFollowPattern-get', 'autoFollowPattern-save'])
      );
    });
  });
});
