/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const { common, unifiedFieldList } = getPageObjects(['common', 'unifiedFieldList']);
  const find = getService('find');
  const log = getService('log');
  const retry = getService('retry');
  const security = getService('security');

  describe('discover doc table newline handling', function describeIndexTests() {
    before(async function () {
      await security.testUser.setRoles(['kibana_admin', 'kibana_message_with_newline']);
      await esArchiver.loadIfNeeded('test/functional/fixtures/es_archiver/message_with_newline');
      await kibanaServer.importExport.load(
        'test/functional/fixtures/kbn_archiver/message_with_newline.json'
      );
      await kibanaServer.uiSettings.replace({
        defaultIndex: 'newline-test',
        'doc_table:legacy': true,
      });
      await common.navigateToApp('discover');
    });

    after(async () => {
      await security.testUser.restoreDefaults();
      await esArchiver.unload('test/functional/fixtures/es_archiver/message_with_newline');
      await kibanaServer.savedObjects.cleanStandardList();
      await kibanaServer.uiSettings.replace({});
    });

    it('should break text on newlines', async function () {
      await unifiedFieldList.clickFieldListItemToggle('message');
      const dscTableRows = await find.allByCssSelector('.kbnDocTable__row');

      await retry.waitFor('height of multi-line content > single-line content', async () => {
        const heightWithoutNewline = await dscTableRows[0].getAttribute('clientHeight');
        const heightWithNewline = await dscTableRows[1].getAttribute('clientHeight');
        log.debug(`Without newlines: ${heightWithoutNewline}, With newlines: ${heightWithNewline}`);

        await common.sleep(10000);
        return Number(heightWithNewline) > Number(heightWithoutNewline);
      });
    });
  });
}
