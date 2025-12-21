/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { httpServiceMock } from '@kbn/core/public/mocks';

import { setupEnvironment } from '../helpers/setup_environment';
import { renderHome } from '../helpers/render_home';
import { httpService } from '../../../public/application/services/http';
import { createNonDataStreamIndex } from '../helpers/actions/data_stream_actions';

jest.mock('react-use/lib/useObservable', () => () => jest.fn());

describe('Index table pagination', () => {
  let httpSetup: ReturnType<typeof setupEnvironment>['httpSetup'];
  let httpRequestsMockHelpers: ReturnType<typeof setupEnvironment>['httpRequestsMockHelpers'];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    const mockEnvironment = setupEnvironment();
    httpService.setup(httpServiceMock.createSetupContract());
    httpRequestsMockHelpers = mockEnvironment.httpRequestsMockHelpers;
    httpSetup = mockEnvironment.httpSetup;
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  const createIndices = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const name = `index-${String(i).padStart(3, '0')}`;
      return createNonDataStreamIndex(name);
    });
  };

  it('honors pageIndex from URL params', async () => {
    httpRequestsMockHelpers.setLoadIndicesResponse(createIndices(25));

    await renderHome(httpSetup, {
      initialEntries: ['/indices?includeHiddenIndices=true&pageSize=10&pageIndex=1'],
    });

    await screen.findByTestId('indexTable');

    const links = screen.getAllByTestId('indexTableIndexNameLink');
    expect(links[0]).toHaveTextContent('index-010');
  });

  it('changes pages when a pagination button is clicked', async () => {
    httpRequestsMockHelpers.setLoadIndicesResponse(createIndices(25));

    await renderHome(httpSetup, {
      initialEntries: ['/indices?includeHiddenIndices=true&pageSize=10'],
    });

    await screen.findByTestId('indexTable');
    expect(screen.getAllByTestId('indexTableIndexNameLink')[0]).toHaveTextContent('index-000');

    const pageButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.euiPaginationButton')
    );
    const page2Button = pageButtons.find((btn) => btn.textContent?.trim() === '2');
    expect(page2Button).toBeDefined();

    fireEvent.click(page2Button!);

    await waitFor(() => {
      expect(screen.getAllByTestId('indexTableIndexNameLink')[0]).toHaveTextContent('index-010');
    });
  });

  it('honors pageSize from URL params', async () => {
    httpRequestsMockHelpers.setLoadIndicesResponse(createIndices(25));

    await renderHome(httpSetup, {
      initialEntries: ['/indices?includeHiddenIndices=true&pageSize=50'],
    });

    await screen.findByTestId('indexTable');

    expect(screen.getAllByTestId('indexTableIndexNameLink')).toHaveLength(25);
  });
});
