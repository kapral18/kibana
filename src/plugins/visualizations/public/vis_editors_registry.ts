/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { VisParams } from '../common';
import { VisEditorConstructor } from './visualize_app/types';

const DEFAULT_NAME = 'default';

export const createVisEditorsRegistry = () => {
  const map = new Map<string, VisEditorConstructor<any>>();

  return {
    registerDefault: (editor: VisEditorConstructor) => {
      map.set(DEFAULT_NAME, editor);
    },
    register: <TVisParams extends VisParams>(
      name: string,
      editor: VisEditorConstructor<TVisParams>
    ) => {
      if (name) {
        map.set(name, editor);
      }
    },
    get: (name: string) => map.get(name || DEFAULT_NAME),
  };
};

export type VisEditorsRegistry = ReturnType<typeof createVisEditorsRegistry>;
