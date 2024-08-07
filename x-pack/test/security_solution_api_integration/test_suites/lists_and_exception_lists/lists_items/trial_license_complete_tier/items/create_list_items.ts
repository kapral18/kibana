/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import { LIST_URL, LIST_ITEM_URL } from '@kbn/securitysolution-list-constants';

import { getCreateMinimalListSchemaMock } from '@kbn/lists-plugin/common/schemas/request/create_list_schema.mock';

import {
  getCreateMinimalListItemSchemaMock,
  getCreateMinimalListItemSchemaMockWithoutId,
} from '@kbn/lists-plugin/common/schemas/request/create_list_item_schema.mock';
import { getListItemResponseMockWithoutAutoGeneratedValues } from '@kbn/lists-plugin/common/schemas/response/list_item_schema.mock';
import TestAgent from 'supertest/lib/agent';
import {
  createListsIndex,
  deleteListsIndex,
  removeListItemServerGeneratedProperties,
} from '../../../utils';

import { FtrProviderContext } from '../../../../../ftr_provider_context';

export default ({ getService }: FtrProviderContext) => {
  const log = getService('log');
  const utils = getService('securitySolutionUtils');

  describe('@ess @serverless @serverlessQA create_list_items', () => {
    let supertest: TestAgent;

    before(async () => {
      supertest = await utils.createSuperTest();
    });

    describe('validation errors', () => {
      it('should give a 404 error that the list must exist first before being able to add a list item', async () => {
        const { body } = await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(404);

        expect(body).to.eql({
          message: 'list id: "some-list-id" does not exist',
          status_code: 404,
        });
      });
    });

    describe('creating list items', () => {
      beforeEach(async () => {
        await createListsIndex(supertest, log);
      });

      afterEach(async () => {
        await deleteListsIndex(supertest, log);
      });

      it('should create a simple list item with a list item id', async () => {
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(200);

        const bodyToCompare = removeListItemServerGeneratedProperties(body);

        expect(bodyToCompare).to.eql(
          getListItemResponseMockWithoutAutoGeneratedValues(await utils.getUsername())
        );
      });

      it('should create a simple list item without an id', async () => {
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMockWithoutId())
          .expect(200);

        const bodyToCompare = removeListItemServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(
          getListItemResponseMockWithoutAutoGeneratedValues(await utils.getUsername())
        );
      });

      it('should cause a 409 conflict if we attempt to create the same list item twice', async () => {
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(200);

        const { body } = await supertest
          .post(LIST_ITEM_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListItemSchemaMock())
          .expect(409);

        expect(body).to.eql({
          message: 'list item id: "some-list-item-id" already exists',
          status_code: 409,
        });
      });
    });
  });
};
