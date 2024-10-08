/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { ComponentType } from 'react';
import { injectI18n, WrappedComponentProps } from '@kbn/i18n-react';
import { EuiFormRow } from '@elastic/eui';
import { IndexPatternSelectProps } from '@kbn/unified-search-plugin/public';

export type IndexPatternSelectFormRowUiProps = WrappedComponentProps & {
  onChange: (opt: any) => void;
  indexPatternId: string;
  controlIndex: number;
  IndexPatternSelect: ComponentType<IndexPatternSelectProps>;
};

function IndexPatternSelectFormRowUi(props: IndexPatternSelectFormRowUiProps) {
  const { controlIndex, indexPatternId, intl, onChange } = props;
  const selectId = `indexPatternSelect-${controlIndex}`;

  return (
    <EuiFormRow
      id={selectId}
      label={intl.formatMessage({
        id: 'inputControl.editor.indexPatternSelect.patternLabel',
        defaultMessage: 'Index Pattern',
      })}
    >
      <props.IndexPatternSelect
        placeholder={intl.formatMessage({
          id: 'inputControl.editor.indexPatternSelect.patternPlaceholder',
          defaultMessage: 'Select index pattern...',
        })}
        indexPatternId={indexPatternId}
        onChange={onChange}
        data-test-subj={selectId}
      />
    </EuiFormRow>
  );
}

export const IndexPatternSelectFormRow = injectI18n(IndexPatternSelectFormRowUi);
