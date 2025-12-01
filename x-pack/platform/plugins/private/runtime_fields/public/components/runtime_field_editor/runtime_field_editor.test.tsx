/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import type { DocLinksStart } from '@kbn/core/public';

import '../../__jest__/setup_environment';
import type { RuntimeField } from '../../types';
import type { FormState } from '../runtime_field_form/runtime_field_form';
import { RuntimeFieldForm } from '../runtime_field_form/runtime_field_form';
import type { Props } from './runtime_field_editor';
import { RuntimeFieldEditor } from './runtime_field_editor';

const docLinks: DocLinksStart = {
  ELASTIC_WEBSITE_URL: 'https://jestTest.elastic.co',
  DOC_LINK_VERSION: 'jest',
  links: {
    runtimeFields: { mapping: 'https://jestTest.elastic.co/to-be-defined.html' },
    scriptedFields: {} as any,
  } as any,
};

describe('Runtime field editor', () => {
  let onChange: jest.Mock<Props['onChange']>;

  const lastOnChangeCall = (): FormState[] => onChange.mock.calls[onChange.mock.calls.length - 1];

  beforeAll(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    onChange = jest.fn();
  });

  test('should render the <RuntimeFieldForm />', () => {
    const { container } = renderWithI18n(<RuntimeFieldEditor docLinks={docLinks} />);

    expect(container.querySelector('.runtimeFieldEditor_form')).toBeInTheDocument();
  });

  test('should accept a defaultValue and onChange prop to forward the form state', async () => {
    const defaultValue: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };
    renderWithI18n(<RuntimeFieldEditor onChange={onChange} defaultValue={defaultValue} docLinks={docLinks} />);

    expect(onChange).toHaveBeenCalled();

    let lastState = lastOnChangeCall()[0];
    expect(lastState.isValid).toBe(undefined);
    expect(lastState.isSubmitted).toBe(false);
    expect(lastState.submit).toBeDefined();

    let data;
    await act(async () => {
      const submit = lastState.submit();
      jest.advanceTimersByTime(0); // advance timers to allow the form to validate
      ({ data } = await submit);
    });
    
    expect(data).toEqual(defaultValue);

    // Make sure that both isValid and isSubmitted state are now "true"
    lastState = lastOnChangeCall()[0];
    expect(lastState.isValid).toBe(true);
    expect(lastState.isSubmitted).toBe(true);
  });

  test('should accept a list of existing concrete fields and display a callout when shadowing one of the fields', async () => {
    const existingConcreteFields = [{ name: 'myConcreteField', type: 'keyword' }];

    renderWithI18n(<RuntimeFieldEditor onChange={onChange} docLinks={docLinks} ctx={{ existingConcreteFields }} />);

    expect(screen.queryByTestId('shadowingFieldCallout')).not.toBeInTheDocument();

    const nameInput = screen.getByTestId('nameField').querySelector('input')!;
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: existingConcreteFields[0].name } });
      jest.advanceTimersByTime(0); // advance timers to allow the form to validate
    });

    await waitFor(() => {
      expect(screen.getByTestId('shadowingFieldCallout')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    test('should accept an optional list of existing runtime fields and prevent creating duplicates', async () => {
      const existingRuntimeFieldNames = ['myRuntimeField'];

      renderWithI18n(<RuntimeFieldEditor onChange={onChange} docLinks={docLinks} ctx={{ namesNotAllowed: existingRuntimeFieldNames }} />);

      const nameInput = screen.getByTestId('nameField').querySelector('input')!;
      const scriptField = screen.getByTestId('scriptField');

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: existingRuntimeFieldNames[0] } });
        fireEvent.change(scriptField, { target: { value: 'echo("hello")' } });
      });

      act(() => {
        jest.advanceTimersByTime(1000); // Make sure our debounced error message is in the DOM
      });

      await act(async () => {
        const submit = lastOnChangeCall()[0].submit();
        jest.advanceTimersByTime(0); // advance timers to allow the form to validate
        await submit;
      });

      await waitFor(() => {
        const lastState = lastOnChangeCall()[0];
        expect(lastState.isValid).toBe(false);
      });

      await waitFor(() => {
        expect(screen.getByText('There is already a field with this name.')).toBeInTheDocument();
      });
    });

    test('should not count the default value as a duplicate', async () => {
      const existingRuntimeFieldNames = ['myRuntimeField'];

      const defaultValue: RuntimeField = {
        name: 'myRuntimeField',
        type: 'boolean',
        script: { source: 'emit("hello")' },
      };

      renderWithI18n(
        <RuntimeFieldEditor
          defaultValue={defaultValue}
          onChange={onChange}
          docLinks={docLinks}
          ctx={{ namesNotAllowed: existingRuntimeFieldNames }}
        />
      );

      await act(async () => {
        const submit = lastOnChangeCall()[0].submit();
        jest.advanceTimersByTime(0); // advance timers to allow the form to validate
        await submit;
      });

      await waitFor(() => {
        const lastState = lastOnChangeCall()[0];
        expect(lastState.isValid).toBe(true);
      });

      expect(screen.queryByText('There is already a field with this name.')).not.toBeInTheDocument();
    });
  });
});
