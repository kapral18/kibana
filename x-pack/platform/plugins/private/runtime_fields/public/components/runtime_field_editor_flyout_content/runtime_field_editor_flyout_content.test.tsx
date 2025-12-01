/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import type { DocLinksStart } from '@kbn/core/public';

import '../../__jest__/setup_environment';
import type { RuntimeField } from '../../types';
import type { Props } from './runtime_field_editor_flyout_content';
import { RuntimeFieldEditorFlyoutContent } from './runtime_field_editor_flyout_content';

const docLinks: DocLinksStart = {
  ELASTIC_WEBSITE_URL: 'htts://jestTest.elastic.co',
  DOC_LINK_VERSION: 'jest',
  links: {
    runtimeFields: { mapping: 'https://jestTest.elastic.co/to-be-defined.html' },
    scriptedFields: {} as any,
  } as any,
};

const noop = () => {};
const defaultProps = { onSave: noop, onCancel: noop, docLinks };

describe('Runtime field editor flyout', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('should have a flyout title', () => {
    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} />);

    const flyoutTitle = screen.getByTestId('flyoutTitle');
    expect(flyoutTitle).toBeInTheDocument();
    expect(flyoutTitle).toHaveTextContent('Create new field');
  });

  test('should allow a runtime field to be provided', () => {
    const field: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };

    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} defaultValue={field} />);

    const flyoutTitle = screen.getByTestId('flyoutTitle');
    expect(flyoutTitle).toHaveTextContent(`Edit ${field.name} field`);

    const nameInput = screen.getByTestId('nameField').querySelector('input');
    expect(nameInput).toHaveValue(field.name);

    const typeField = screen.getByTestId('typeField');
    expect(typeField).toHaveValue(field.type);

    const scriptField = screen.getByTestId('scriptField');
    expect(scriptField).toHaveValue(field.script.source);
  });

  test('should accept an onSave prop', async () => {
    const field: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };
    const onSave: jest.Mock<Props['onSave']> = jest.fn();

    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} defaultValue={field} />);

    const saveButton = screen.getByTestId('saveFieldButton');

    await act(async () => {
      fireEvent.click(saveButton);
      jest.advanceTimersByTime(0); // advance timers to allow the form to validate
    });

    expect(onSave).toHaveBeenCalled();
    const fieldReturned: RuntimeField = onSave.mock.calls[onSave.mock.calls.length - 1][0];
    expect(fieldReturned).toEqual(field);
  });

  test('should accept an onCancel prop', () => {
    const onCancel = jest.fn();
    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onCancel={onCancel} />);

    const closeFlyoutButton = screen.getByTestId('closeFlyoutButton');
    fireEvent.click(closeFlyoutButton);

    expect(onCancel).toHaveBeenCalled();
  });

  describe('validation', () => {
    test('should validate the fields and prevent saving invalid form', async () => {
      const onSave: jest.Mock<Props['onSave']> = jest.fn();

      renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} />);

      const saveButton = screen.getByTestId('saveFieldButton');
      expect(saveButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(saveButton);
        jest.advanceTimersByTime(0); // advance timers to allow the form to validate
      });

      expect(onSave).toHaveBeenCalledTimes(0);
      
      await waitFor(() => {
        const updatedSaveButton = screen.getByTestId('saveFieldButton');
        expect(updatedSaveButton).toBeDisabled();
      });

      expect(screen.getByText('Give a name to the field.')).toBeInTheDocument();
      expect(screen.getByTestId('formError')).toBeInTheDocument();
      expect(screen.getByTestId('formError')).toHaveTextContent('Fix errors in form before continuing.');
    });

    test('should forward values from the form', async () => {
      const onSave: jest.Mock<Props['onSave']> = jest.fn();

      renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByTestId('nameField').querySelector('input')!;
      const scriptField = screen.getByTestId('scriptField');

      act(() => {
        fireEvent.change(nameInput, { target: { value: 'someName' } });
        fireEvent.change(scriptField, { target: { value: 'script=123' } });
      });

      await act(async () => {
        const saveButton = screen.getByTestId('saveFieldButton');
        fireEvent.click(saveButton);
        jest.advanceTimersByTime(0);
      });

      expect(onSave).toHaveBeenCalled();
      const fieldReturned: RuntimeField = onSave.mock.calls[onSave.mock.calls.length - 1][0];
      expect(fieldReturned).toEqual({
        name: 'someName',
        type: 'keyword', // default to keyword
        script: { source: 'script=123' },
      });
    });
  });
});
