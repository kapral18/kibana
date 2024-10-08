/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MockRouter, mockRequestHandler, mockDependencies } from '../../__mocks__';

import { registerAppSearchGatedFormRoute } from './app_search_gated_form';

describe('Overview route with kibana_uis_enabled ', () => {
  describe('POST /internal/app_search/as_gate', () => {
    let mockRouter: MockRouter;

    beforeEach(() => {
      jest.clearAllMocks();
      mockRouter = new MockRouter({
        method: 'post',
        path: '/internal/app_search/as_gate',
      });

      registerAppSearchGatedFormRoute({
        ...mockDependencies,
        router: mockRouter.router,
      });
    });

    it('creates a request handler', () => {
      expect(mockRequestHandler.createRequest).toHaveBeenCalledWith({
        path: '/api/ent/v2/internal/as_gate',
      });
    });

    describe('validates', () => {
      it('correctly', () => {
        const request = {
          body: {
            as_gate_data: {
              additional_feedback: '',
              feature: 'Selected feature',
              features_other: '',
              participate_in_ux_labs: true,
            },
          },
        };
        mockRouter.shouldValidate(request);
      });

      it('throws error unexpected values in body', () => {
        const request = {
          body: {
            foo: 'bar',
          },
        };
        mockRouter.shouldThrow(request);
      });
    });
  });
});
