/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { RulePageFooter } from './rule_page_footer';
import {
  RULE_PAGE_FOOTER_CANCEL_TEXT,
  RULE_PAGE_FOOTER_CREATE_TEXT,
  RULE_PAGE_FOOTER_SAVE_TEXT,
  RULE_PAGE_FOOTER_SHOW_REQUEST_TEXT,
} from '../translations';

jest.mock('../validation/validate_form', () => ({
  hasRuleErrors: jest.fn(),
}));

jest.mock('../hooks', () => ({
  useRuleFormState: jest.fn(),
  useRuleFormScreenContext: jest.fn(),
}));

const { hasRuleErrors } = jest.requireMock('../validation/validate_form');
const { useRuleFormState, useRuleFormScreenContext } = jest.requireMock('../hooks');

const onSave = jest.fn();
const onCancel = jest.fn();

hasRuleErrors.mockReturnValue(false);

const mockSetIsShowRequestScreenVisible = jest.fn();

describe('rulePageFooter', () => {
  beforeEach(() => {
    useRuleFormState.mockReturnValue({
      plugins: {
        application: {
          capabilities: {
            actions: {
              show: true,
            },
          },
        },
      },
      baseErrors: {},
      paramsErrors: {},
      formData: {
        actions: [],
      },
    });
    useRuleFormScreenContext.mockReturnValue({
      setIsShowRequestScreenVisible: mockSetIsShowRequestScreenVisible,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders create footer correctly', () => {
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByText(RULE_PAGE_FOOTER_CANCEL_TEXT)).toBeInTheDocument();
    expect(screen.getByText(RULE_PAGE_FOOTER_SHOW_REQUEST_TEXT)).toBeInTheDocument();
    expect(screen.getByText(RULE_PAGE_FOOTER_CREATE_TEXT)).toBeInTheDocument();
  });

  test('renders edit footer correctly', () => {
    render(<RulePageFooter isEdit onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByText(RULE_PAGE_FOOTER_CANCEL_TEXT)).toBeInTheDocument();
    expect(screen.getByText(RULE_PAGE_FOOTER_SHOW_REQUEST_TEXT)).toBeInTheDocument();
    expect(screen.getByText(RULE_PAGE_FOOTER_SAVE_TEXT)).toBeInTheDocument();
  });

  test('should open show request modal when the button is clicked', () => {
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('rulePageFooterShowRequestButton'));
    expect(mockSetIsShowRequestScreenVisible).toHaveBeenCalledWith(true);
  });

  test('should show create rule confirmation', () => {
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('rulePageFooterSaveButton'));
    expect(screen.getByTestId('confirmCreateRuleModal')).toBeInTheDocument();
  });

  test('should not show creat rule confirmation if user cannot read actions', () => {
    useRuleFormState.mockReturnValue({
      plugins: {
        application: {
          capabilities: {
            actions: {
              show: false,
            },
          },
        },
      },
      baseErrors: {},
      paramsErrors: {},
      formData: {
        actions: [],
      },
    });

    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('rulePageFooterSaveButton'));
    expect(screen.queryByTestId('confirmCreateRuleModal')).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalled();
  });

  test('should show call onSave if clicking rule confirmation', () => {
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('rulePageFooterSaveButton'));
    fireEvent.click(screen.getByTestId('confirmModalConfirmButton'));
    expect(onSave).toHaveBeenCalled();
  });

  test('should cancel when the cancel button is clicked', () => {
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    fireEvent.click(screen.getByTestId('rulePageFooterCancelButton'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('should disable buttons when saving', () => {
    render(<RulePageFooter isSaving onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByTestId('rulePageFooterCancelButton')).toBeDisabled();
    expect(screen.getByTestId('rulePageFooterShowRequestButton')).toBeDisabled();
    expect(screen.getByTestId('rulePageFooterSaveButton')).toBeDisabled();
  });

  test('should disable save and show request buttons when there is an error', () => {
    hasRuleErrors.mockReturnValue(true);
    render(<RulePageFooter onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByTestId('rulePageFooterShowRequestButton')).toBeDisabled();
    expect(screen.getByTestId('rulePageFooterSaveButton')).toBeDisabled();
    expect(screen.getByTestId('rulePageFooterCancelButton')).not.toBeDisabled();
  });
});
