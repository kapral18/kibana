/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { setup as watchListPageSetup } from './watch_list_page.helpers';
import { setup as watchStatusPageSetup } from './watch_status_page.helpers';
import { setup as watchCreateJsonPageSetup } from './watch_create_json_page.helpers';
import { setup as watchCreateThresholdPageSetup } from './watch_create_threshold_page.helpers';
import { setup as watchEditPageSetup } from './watch_edit_page.helpers';

export { getRandomString } from './random';
export { setupEnvironment } from './setup_environment';
export { findTestSubject, findAllTestSubjects } from './render';

export const pageHelpers = {
  watchListPage: { setup: watchListPageSetup },
  watchStatusPage: { setup: watchStatusPageSetup },
  watchCreateJsonPage: { setup: watchCreateJsonPageSetup },
  watchCreateThresholdPage: { setup: watchCreateThresholdPageSetup },
  watchEditPage: { setup: watchEditPageSetup },
};
