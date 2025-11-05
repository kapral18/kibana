/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import type { DocLinksStart } from '@kbn/core/public';

import '../../__jest__/setup_environment';
import { renderWithI18n, createUserEvent } from '../../test_utils';
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

    const title = screen.getByTestId('flyoutTitle');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Create new field');
  });

  test('should allow a runtime field to be provided', () => {
    const field: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };

    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} defaultValue={field} />);

    const title = screen.getByTestId('flyoutTitle');
    expect(title).toHaveTextContent(`Edit ${field.name} field`);

    const nameField = screen.getByTestId('nameField');
    const nameInput = within(nameField).getByTestId('input') as HTMLInputElement;
    const typeInput = screen.getByTestId('typeField') as HTMLInputElement;
    const scriptInput = screen.getByTestId('scriptField') as HTMLInputElement;

    expect(nameInput.value).toBe(field.name);
    expect(typeInput.value).toBe(field.type);
    expect(scriptInput.value).toBe(field.script.source);
  });

  test('should accept an onSave prop', async () => {
    const field: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };
    const onSave: jest.Mock<Props['onSave']> = jest.fn();

    renderWithI18n(
      <RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} defaultValue={field} />
    );

    const saveButton = screen.getByTestId('saveFieldButton');
    saveButton.click();

    await jest.advanceTimersByTimeAsync(0); // advance timers to allow the form to validate

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const fieldReturned: RuntimeField = onSave.mock.calls[onSave.mock.calls.length - 1][0];
    expect(fieldReturned).toEqual(field);
  });

  test('should accept an onCancel prop', () => {
    const onCancel = jest.fn();
    renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onCancel={onCancel} />);

    const closeButton = screen.getByTestId('closeFlyoutButton');
    closeButton.click();

    expect(onCancel).toHaveBeenCalled();
  });

  describe('validation', () => {
    test('should validate the fields and prevent saving invalid form', async () => {
      const onSave: jest.Mock<Props['onSave']> = jest.fn();

      renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} />);

      const saveButton = screen.getByTestId('saveFieldButton') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(false);

      saveButton.click();
      await jest.advanceTimersByTimeAsync(0); // advance timers to allow the form to validate

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(0);
      });

      await waitFor(() => {
        const disabledButton = screen.getByTestId('saveFieldButton') as HTMLButtonElement;
        expect(disabledButton.disabled).toBe(true);
      });

      await waitFor(() => {
        expect(screen.getByText('Give a name to the field.')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('formError')).toBeInTheDocument();
        expect(screen.getByTestId('formError')).toHaveTextContent(
          'Fix errors in form before continuing.'
        );
      });
    });

    test('should forward values from the form', async () => {
      const user = createUserEvent();
      const onSave: jest.Mock<Props['onSave']> = jest.fn();

      renderWithI18n(<RuntimeFieldEditorFlyoutContent {...defaultProps} onSave={onSave} />);

      const nameField = screen.getByTestId('nameField');
      const nameInput = within(nameField).getByTestId('input');
      const scriptInput = screen.getByTestId('scriptField');

      await user.type(nameInput, 'someName');
      await user.type(scriptInput, 'script=123');

      const saveButton = screen.getByTestId('saveFieldButton');
      saveButton.click();
      await jest.advanceTimersByTimeAsync(0);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });

      let fieldReturned: RuntimeField = onSave.mock.calls[onSave.mock.calls.length - 1][0];
      expect(fieldReturned).toEqual({
        name: 'someName',
        type: 'keyword', // default to keyword
        script: { source: 'script=123' },
      });

      // Change the type and make sure it is forwarded
      const typeInput = screen.getByTestId('typeField') as any;

      // Get the React props from the fiber node
      const reactPropsKey = Object.keys(typeInput).find((key) => key.startsWith('__reactProps'));
      const reactProps = reactPropsKey ? typeInput[reactPropsKey] : null;

      if (reactProps && reactProps.onChange) {
        // Call onChange directly with the mock event format
        reactProps.onChange({
          '0': {
            label: 'Other type',
            value: 'other_type',
          },
        });
      }

      jest.advanceTimersByTime(0);

      saveButton.click();
      await jest.advanceTimersByTimeAsync(0);

      await waitFor(() => {
        fieldReturned = onSave.mock.calls[onSave.mock.calls.length - 1][0];
        expect(fieldReturned).toEqual({
          name: 'someName',
          type: 'other_type',
          script: { source: 'script=123' },
        });
      });
    });
  });
});
