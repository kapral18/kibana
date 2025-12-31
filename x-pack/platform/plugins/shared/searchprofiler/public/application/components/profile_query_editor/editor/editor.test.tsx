/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@kbn/monaco', () => ({
  XJsonLang: { ID: 'xjson' },
}));

jest.mock('@kbn/code-editor', () => {
  return {
    CodeEditor: ({
      value,
      onChange,
      dataTestSubj,
      editorDidMount,
      options,
    }: {
      value: string;
      onChange: (value: string) => void;
      dataTestSubj: string;
      editorDidMount?: (editor: { focus: () => void }) => void;
      options?: { readOnly?: boolean };
    }) => {
      editorDidMount?.({ focus: () => {} });

      return (
        <textarea
          data-test-subj={dataTestSubj}
          value={value}
          readOnly={Boolean(options?.readOnly)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
  };
});

import type { Props } from './editor';
import { Editor } from './editor';

describe('Editor Component', () => {
  it('renders', () => {
    const setEditorValue = jest.fn();
    const onEditorReady = jest.fn();

    const props: Props = {
      editorValue: '',
      setEditorValue,
      licenseEnabled: true,
      onEditorReady,
    };

    render(<Editor {...props} />);

    const editor = screen.getByTestId('searchProfilerEditor');
    expect(editor).toBeInTheDocument();
    expect(editor).not.toHaveAttribute('readonly');

    expect(onEditorReady).toHaveBeenCalledTimes(1);

    fireEvent.change(editor, { target: { value: '{ "query": {} }' } });
    expect(setEditorValue).toHaveBeenCalledWith('{ "query": {} }');
  });
});
