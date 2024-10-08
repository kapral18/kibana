/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { Trigger } from '.';

export const ADD_PANEL_TRIGGER = 'ADD_PANEL_TRIGGER';

export const addPanelMenuTrigger: Trigger = {
  id: ADD_PANEL_TRIGGER,
  title: i18n.translate('uiActions.triggers.dashboard.addPanelMenu.title', {
    defaultMessage: 'Add panel menu',
  }),
  description: i18n.translate('uiActions.triggers.dashboard.addPanelMenu.description', {
    defaultMessage: "A new action will appear to the dashboard's add panel menu",
  }),
};
