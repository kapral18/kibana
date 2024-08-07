/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { httpServiceMock } from '@kbn/core/public/mocks';
import { Rule } from '../../types';
import { updateRule, UpdateRuleBody } from '.';

const http = httpServiceMock.createStartContract();

describe('updateRule', () => {
  test('should call rule update API', async () => {
    const ruleToUpdate = {
      consumer: 'alerts',
      name: 'test',
      tags: ['foo'],
      schedule: {
        interval: '1m',
      },
      params: {},
      createdAt: new Date('1970-01-01T00:00:00.000Z'),
      updatedAt: new Date('1970-01-01T00:00:00.000Z'),
      apiKey: null,
      apiKeyOwner: null,
      revision: 0,
      alertDelay: {
        active: 10,
      },
      actions: [
        {
          group: 'default',
          id: '2',
          actionTypeId: 'test',
          params: {},
          useAlertDataForTemplate: false,
          frequency: {
            notifyWhen: 'onActionGroupChange',
            throttle: null,
            summary: false,
          },
        },
        {
          id: '.test-system-action',
          params: {},
          actionTypeId: '.system-action',
        },
      ],
    };

    const resolvedValue: Rule = {
      ...ruleToUpdate,
      id: '12/3',
      enabled: true,
      ruleTypeId: 'test',
      createdBy: null,
      updatedBy: null,
      muteAll: false,
      mutedInstanceIds: [],
      executionStatus: {
        status: 'unknown',
        lastExecutionDate: new Date('2020-08-20T19:23:38Z'),
      },
      revision: 1,
    };

    http.put.mockResolvedValueOnce({
      ...resolvedValue,
      actions: [
        {
          group: 'default',
          id: '2',
          connector_type_id: 'test',
          params: {},
          use_alert_data_for_template: false,
          frequency: {
            notify_when: 'onActionGroupChange',
            throttle: null,
            summary: false,
          },
        },
        {
          id: '.test-system-action',
          params: {},
          connector_type_id: '.system-action',
        },
      ],
    });

    const result = await updateRule({ http, id: '12/3', rule: ruleToUpdate as UpdateRuleBody });

    expect(result).toEqual({
      ...resolvedValue,
      actions: [
        {
          group: 'default',
          id: '2',
          actionTypeId: 'test',
          params: {},
          useAlertDataForTemplate: false,
          frequency: {
            notifyWhen: 'onActionGroupChange',
            throttle: null,
            summary: false,
          },
        },
        {
          id: '.test-system-action',
          params: {},
          actionTypeId: '.system-action',
        },
      ],
    });

    expect(http.put).toHaveBeenCalledWith('/api/alerting/rule/12%2F3', {
      body: '{"name":"test","tags":["foo"],"schedule":{"interval":"1m"},"params":{},"actions":[{"group":"default","id":"2","params":{},"frequency":{"notify_when":"onActionGroupChange","throttle":null,"summary":false},"use_alert_data_for_template":false},{"id":".test-system-action","params":{}}],"alert_delay":{"active":10}}',
    });
  });
});
