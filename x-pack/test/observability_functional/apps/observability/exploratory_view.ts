/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Path from 'path';
import expect from '@kbn/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const PageObjects = getPageObjects(['observability', 'common', 'header']);
  const esArchiver = getService('esArchiver');
  const find = getService('find');

  const testSubjects = getService('testSubjects');

  const rangeFrom = '2021-01-17T16%3A46%3A15.338Z';
  const rangeTo = '2021-01-19T17%3A01%3A32.309Z';
  const ARCHIVES_DIR_REL_PATH =
    'x-pack/solutions/observability/test/apm_api_integration/common/fixtures/es_archiver';

  describe('ExploratoryView', () => {
    before(async () => {
      await esArchiver.loadIfNeeded(Path.join(ARCHIVES_DIR_REL_PATH, '8.0.0'));

      await esArchiver.loadIfNeeded(Path.join(ARCHIVES_DIR_REL_PATH, 'rum_8.0.0'));

      await esArchiver.loadIfNeeded(Path.join(ARCHIVES_DIR_REL_PATH, 'rum_test_data'));
    });

    after(async () => {
      await esArchiver.unload(Path.join(ARCHIVES_DIR_REL_PATH, '8.0.0'));

      await esArchiver.unload(Path.join(ARCHIVES_DIR_REL_PATH, 'rum_8.0.0'));
      await esArchiver.unload(Path.join(ARCHIVES_DIR_REL_PATH, 'rum_test_data'));
    });

    it('should go to ux app', async function () {
      await PageObjects.common.navigateToApp('ux', {
        search: `?rangeFrom=${rangeFrom}&rangeTo=${rangeTo}`,
      });

      await PageObjects.header.waitUntilLoadingHasFinished();
    });

    it('should able to open exploratory view from ux app', async () => {
      await testSubjects.exists('uxAnalyzeBtn');
      await testSubjects.click('uxAnalyzeBtn');

      await PageObjects.header.waitUntilLoadingHasFinished();
    });

    it('renders lens visualization', async () => {
      expect(await testSubjects.exists('xyVisChart')).to.eql(true);

      expect(
        await find.existsByCssSelector('div[data-title="Prefilled from exploratory view app"]')
      ).to.eql(true);

      expect((await find.byCssSelector('dd')).getVisibleText()).to.eql(true);
    });

    it('can do a breakdown per series', async () => {
      await testSubjects.click('editSeries0');

      await testSubjects.click('seriesBreakdown');

      expect(await find.existsByCssSelector('[id="user_agent.name"]')).to.eql(true);

      await find.clickByCssSelector('[id="user_agent.name"]');

      await testSubjects.click('seriesChangesApplyButton');

      await PageObjects.header.waitUntilLoadingHasFinished();

      // if breakdown we should have multiple legend items
      const legendItems = await find.allByCssSelector('.echLegendItem');
      expect(legendItems.length).to.be(11);
    });
  });
}
