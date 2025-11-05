/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import type { Props } from './editor';
import { Editor } from './editor';

describe('Editor Component', () => {
  it('renders', () => {
    const props: Props = {
      editorValue: '',
      setEditorValue: () => {},
      licenseEnabled: true,
      onEditorReady: (e: any) => {},
    };
    // Ignore the warning about Worker not existing for now...
    const { container } = renderWithI18n(<Editor {...props} />);
    expect(container).toBeInTheDocument();
  });
});
