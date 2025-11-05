/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';

import '../../__jest__/setup_environment';
import { renderWithI18n } from '../../test_utils';
import type { RuntimeField } from '../../types';
import type { Props, FormState } from './runtime_field_form';
import { RuntimeFieldForm } from './runtime_field_form';

const links = {
  runtimePainless: 'https://jestTest.elastic.co/to-be-defined.html',
};

describe('Runtime field form', () => {
  let onChange: jest.Mock<Props['onChange']> = jest.fn();

  const lastOnChangeCall = (): FormState[] => onChange.mock.calls[onChange.mock.calls.length - 1];

  beforeEach(() => {
    onChange = jest.fn();
  });

  test('should render expected 3 fields (name, returnType, script)', () => {
    renderWithI18n(<RuntimeFieldForm links={links} />);

    expect(screen.getByTestId('nameField')).toBeInTheDocument();
    expect(screen.getByTestId('typeField')).toBeInTheDocument();
    expect(screen.getByTestId('scriptField')).toBeInTheDocument();
  });

  test('should have a link to learn more about painless syntax', () => {
    renderWithI18n(<RuntimeFieldForm links={links} />);

    const link = screen.getByTestId('painlessSyntaxLearnMoreLink');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', links.runtimePainless);
  });

  test('should accept a "defaultValue" prop', () => {
    const defaultValue: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };
    renderWithI18n(<RuntimeFieldForm defaultValue={defaultValue} links={links} />);

    const nameField = screen.getByTestId('nameField');
    const nameInput = within(nameField).getByTestId('input') as HTMLInputElement;
    const typeInput = screen.getByTestId('typeField') as HTMLInputElement;
    const scriptInput = screen.getByTestId('scriptField') as HTMLInputElement;

    expect(nameInput.value).toBe(defaultValue.name);
    expect(typeInput.value).toBe(defaultValue.type);
    expect(scriptInput.value).toBe(defaultValue.script.source);
  });

  test('should accept an "onChange" prop to forward the form state', async () => {
    const defaultValue: RuntimeField = {
      name: 'foo',
      type: 'date',
      script: { source: 'test=123' },
    };
    renderWithI18n(
      <RuntimeFieldForm onChange={onChange} defaultValue={defaultValue} links={links} />
    );

    expect(onChange).toHaveBeenCalled();

    let lastState = lastOnChangeCall()[0];
    expect(lastState.isValid).toBe(undefined);
    expect(lastState.isSubmitted).toBe(false);
    expect(lastState.submit).toBeDefined();

    let data;
    await waitFor(async () => {
      ({ data } = await lastState.submit());
      expect(data).toEqual(defaultValue);
    });

    // Make sure that both isValid and isSubmitted state are now "true"
    await waitFor(() => {
      lastState = lastOnChangeCall()[0];
      expect(lastState.isValid).toBe(true);
      expect(lastState.isSubmitted).toBe(true);
    });
  });
});
