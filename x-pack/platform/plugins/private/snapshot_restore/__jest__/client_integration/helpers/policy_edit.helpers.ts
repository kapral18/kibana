/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { HttpSetup } from '@kbn/core/public';
import { PolicyEdit } from '../../../public/application/sections/policy_edit';
import { POLICY_NAME } from './constant';
import { formSetup } from './policy_form.helpers';
import { renderWithRouter } from './setup_environment';

export const setup = (httpSetup: HttpSetup) => {
  const renderResult = renderWithRouter(<PolicyEdit />, {
    initialEntries: [`/edit_policy/${POLICY_NAME}`],
    httpSetup,
  });

  return formSetup(renderResult);
};
