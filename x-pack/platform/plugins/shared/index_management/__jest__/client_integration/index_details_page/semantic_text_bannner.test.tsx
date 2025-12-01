/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import { SemanticTextBanner } from '../../../public/application/sections/home/index_list/details_page/semantic_text_banner';

describe('When semantic_text is enabled', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    renderWithI18n(<SemanticTextBanner isSemanticTextEnabled={true} isPlatinumLicense={true} />);
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('should display the banner', () => {
    expect(getItemSpy).toHaveBeenCalledWith('semantic-text-banner-display');
    expect(screen.queryByTestId('indexDetailsMappingsSemanticTextBanner')).toBeInTheDocument();
  });

  it('should contain content related to semantic_text', () => {
    const banner = screen.getByTestId('indexDetailsMappingsSemanticTextBanner');
    expect(banner).toHaveTextContent('semantic_text field type now available!');
    expect(banner).toHaveTextContent(
      'Documents will be automatically chunked to fit model context limits, to avoid truncation.'
    );
  });

  it('should hide the banner if dismiss is clicked', () => {
    const dismissButton = screen.getByTestId('SemanticTextBannerDismissButton');
    fireEvent.click(dismissButton);

    expect(setItemSpy).toHaveBeenCalledWith('semantic-text-banner-display', 'false');
    expect(screen.queryByTestId('indexDetailsMappingsSemanticTextBanner')).not.toBeInTheDocument();
  });
});

describe('when user does not have ML permissions', () => {
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('true');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
  });

  it('should contain content related to semantic_text', () => {
    renderWithI18n(<SemanticTextBanner isSemanticTextEnabled={true} isPlatinumLicense={false} />);

    const banner = screen.getByTestId('indexDetailsMappingsSemanticTextBanner');
    expect(banner).toHaveTextContent('Semantic text now available for platinum license');
  });
});

describe('When semantic_text is disabled', () => {
  it('should not display the banner', () => {
    renderWithI18n(<SemanticTextBanner isSemanticTextEnabled={false} />);

    expect(screen.queryByTestId('indexDetailsMappingsSemanticTextBanner')).not.toBeInTheDocument();
  });
});
