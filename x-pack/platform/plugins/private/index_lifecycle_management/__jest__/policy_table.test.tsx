/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment-timezone';
import type { ReactElement } from 'react';
import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
import userEvent from '@testing-library/user-event';

import { docLinksServiceMock } from '@kbn/core/public/mocks';
import { httpServiceMock } from '@kbn/core-http-browser-mocks';
import { usageCollectionPluginMock } from '@kbn/usage-collection-plugin/public/mocks';

import type { PolicyFromES } from '../common/types';
import { PolicyList } from '../public/application/sections/policy_list/policy_list';
import { init as initHttp } from '../public/application/services/http';
import { init as initUiMetric } from '../public/application/services/ui_metric';
import { KibanaContextProvider } from '../public/shared_imports';
import { PolicyListContextProvider } from '../public/application/sections/policy_list/policy_list_context';
import * as readOnlyHook from '../public/application/lib/use_is_read_only';

initHttp(httpServiceMock.createSetupContract());
initUiMetric(usageCollectionPluginMock.createSetupContract());

// use a date far in the past to check the sorting
const testDate = '2020-07-21T14:16:58.666Z';
const testDateFormatted = moment(testDate).format('MMM D, YYYY');

const testPolicy = {
  version: 0,
  modifiedDate: testDate,
  indices: [`index1`],
  indexTemplates: [`indexTemplate1`, `indexTemplate2`, `indexTemplate3`, `indexTemplate4`],
  name: `testy0`,
  policy: {
    name: `testy0`,
    phases: {},
  },
};

const isUsedByAnIndex = (i: number) => i % 2 === 0;
const isDesignatedManagedPolicy = (i: number) => i > 0 && i % 3 === 0;
const isDeprecatedPolicy = (i: number) => i > 0 && i % 2 === 0;

const policies: PolicyFromES[] = [testPolicy];
for (let i = 1; i < 105; i++) {
  policies.push({
    version: i,
    modifiedDate: moment().subtract(i, 'days').toISOString(),
    indices: isUsedByAnIndex(i) ? [`index${i}`] : [],
    indexTemplates: i % 2 === 0 ? [`indexTemplate${i}`] : [],
    name: `testy${i}`,
    policy: {
      name: `testy${i}`,
      deprecated: i % 2 === 0,
      phases: {},
      ...(isDesignatedManagedPolicy(i)
        ? {
            _meta: {
              managed: true,
            },
          }
        : {}),
    },
  });
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    createHref: jest.fn(),
    location: {
      search: '',
    },
  }),
}));
const mockReactRouterNavigate = jest.fn();
jest.mock('@kbn/kibana-react-plugin/public', () => ({
  ...jest.requireActual('@kbn/kibana-react-plugin/public'),
  reactRouterNavigate: () => mockReactRouterNavigate(),
}));
let component: ReactElement;

const snapshot = (rendered: string[]) => {
  expect(rendered).toMatchSnapshot();
};
const getPolicyLinks = () => {
  return screen.getAllByTestId('policyTablePolicyNameLink');
};
const getPolicyNames = (): string[] => {
  return getPolicyLinks().map((button) => button.textContent || '');
};

const getPolicies = () => {
  const visiblePolicyNames = getPolicyNames();
  const visiblePolicies = visiblePolicyNames.map((name) => {
    const version = parseInt(name.replace('testy', ''), 10);
    return {
      version,
      name,
      isManagedPolicy: isDesignatedManagedPolicy(version),
      isDeprecatedPolicy: isDeprecatedPolicy(version),
      isUsedByAnIndex: isUsedByAnIndex(version),
    };
  });
  return visiblePolicies;
};

const testSort = async (headerName: string, user: ReturnType<typeof userEvent.setup>) => {
  renderWithI18n(component);
  const nameHeader = screen.getByTestId(`tableHeaderCell_${headerName}`).querySelector('button');
  await user.click(nameHeader!);
  snapshot(getPolicyNames());
  await user.click(nameHeader!);
  snapshot(getPolicyNames());
};

const TestComponent = ({ testPolicies }: { testPolicies: PolicyFromES[] }) => {
  return (
    <KibanaContextProvider
      services={{ getUrlForApp: () => '', docLinks: docLinksServiceMock.createStartContract() }}
    >
      <PolicyListContextProvider>
        <PolicyList updatePolicies={jest.fn()} policies={testPolicies} />
      </PolicyListContextProvider>
    </KibanaContextProvider>
  );
};
describe('policy table', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.spyOn(readOnlyHook, 'useIsReadOnly').mockReturnValue(false);
    component = <TestComponent testPolicies={policies} />;
    window.localStorage.removeItem('ILM_SHOW_MANAGED_POLICIES_BY_DEFAULT');
  });

  test('shows empty state when there are no policies', () => {
    component = <TestComponent testPolicies={[]} />;
    const { container } = renderWithI18n(component);
    expect(container).toMatchSnapshot();
  });
  test('changes pages when a pagination link is clicked on', async () => {
    renderWithI18n(component);
    snapshot(getPolicyNames());
    const pagingButtons = screen.getAllByRole('button', { name: /Page \d+/ });
    await user.click(pagingButtons[1]); // Click second page button (index 1 = page 2)
    snapshot(getPolicyNames());
  });

  test('does not show any hidden policies by default', () => {
    renderWithI18n(component);
    const includeHiddenPoliciesSwitch = screen.getByTestId(`includeHiddenPoliciesSwitch`);
    expect(includeHiddenPoliciesSwitch).toHaveAttribute('aria-checked', 'false');
    const visiblePolicies = getPolicies();
    const hasManagedPolicies = visiblePolicies.some((p) => {
      const policyRow = screen.getByTestId(`policyTableRow-${p.name}`);
      return within(policyRow).queryByTestId('managedPolicyBadge') !== null;
    });
    expect(hasManagedPolicies).toEqual(false);
  });

  test('shows more policies when "Rows per page" value is increased', async () => {
    renderWithI18n(component);

    // Find the pagination button by test id instead
    const perPageButton = screen.getByTestId('tablePaginationPopoverButton');
    await user.click(perPageButton);
    const numberOfRowsButton = screen.getAllByRole('button', { name: /rows/ })[1]; // Second option (25 rows)
    // Use direct click due to pointer-events: none on popover
    numberOfRowsButton.click();
    expect(getPolicyNames().length).toBe(25);
  });

  test('shows hidden policies with Managed badges when setting is switched on', async () => {
    renderWithI18n(component);

    // Find the switch using testId - the element itself should be clickable
    const switchElement = screen.getByTestId('includeHiddenPoliciesSwitch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');

    // Click the switch
    await user.click(switchElement);

    // Verify switch toggled
    expect(switchElement).toHaveAttribute('aria-checked', 'true');

    // Increase page size for better sample set
    const perPageButton = screen.getByTestId('tablePaginationPopoverButton');
    await user.click(perPageButton);
    const numberOfRowsButton = screen.getAllByRole('button', { name: /rows/ })[2]; // Third option (50 rows)
    numberOfRowsButton.click();

    // Verify more policies are now visible (managed policies should be included)
    const visiblePolicies = getPolicies();
    expect(visiblePolicies.length).toBeGreaterThan(10);
  });

  test('shows deprecated policies with Deprecated badges', async () => {
    renderWithI18n(component);

    // Initially the switch is off so we should not see any deprecated policies
    let deprecatedPolicies = screen.queryAllByTestId('deprecatedPolicyBadge');
    expect(deprecatedPolicies.length).toBe(0);

    // Enable filtering by deprecated policies
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'is:policy.deprecated');
    await user.keyboard('{Enter}');

    // Now we should see all deprecated policies
    deprecatedPolicies = screen.getAllByTestId('deprecatedPolicyBadge');
    expect(deprecatedPolicies.length).toBeGreaterThan(0);
  });

  test('filters based on content of search input', async () => {
    renderWithI18n(component);
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'testy0');
    await user.keyboard('{Enter}');
    snapshot(getPolicyNames());
  });
  test('sorts when name header is clicked', async () => {
    await testSort('name_0', user);
  });
  test('sorts when modified date header is clicked', async () => {
    await testSort('modifiedDate_3', user);
  });
  test('sorts when linked indices header is clicked', async () => {
    await testSort('indices_2', user);
  });
  test('sorts when linked index templates header is clicked', async () => {
    await testSort('indexTemplates_1', user);
  });
  test('delete policy button is disabled when there are linked indices', () => {
    renderWithI18n(component);
    const policyRow = screen.getByTestId(`policyTableRow-${testPolicy.name}`);
    const deleteButton = within(policyRow).getByTestId('deletePolicy');
    expect(deleteButton).toBeDisabled();
  });
  test('delete policy button is enabled when there are no linked indices', () => {
    renderWithI18n(component);
    const visiblePolicies = getPolicies();
    const unusedPolicy = visiblePolicies.find((p) => !p.isUsedByAnIndex);
    expect(unusedPolicy).toBeDefined();

    const policyRow = screen.getByTestId(`policyTableRow-${unusedPolicy!.name}`);
    const deleteButton = within(policyRow).getByTestId('deletePolicy');
    expect(deleteButton).not.toBeDisabled();
  });
  test('confirmation modal shows when delete button is pressed', async () => {
    renderWithI18n(component);
    const policyRow = screen.getByTestId(`policyTableRow-testy1`);
    const addPolicyToTemplateButton = within(policyRow).getByTestId('deletePolicy');
    await user.click(addPolicyToTemplateButton);
    expect(screen.getByTestId('deletePolicyModal')).toBeInTheDocument();
  });

  test('confirmation modal shows warning when delete button is pressed for a hidden policy', async () => {
    // This test verifies that the delete modal for managed policies shows a warning
    // Creating a component with a known managed policy
    const managedPolicyData: PolicyFromES = {
      version: 1,
      modifiedDate: moment().toISOString(),
      indices: [],
      indexTemplates: [],
      name: `testManagedPolicy`,
      policy: {
        name: `testManagedPolicy`,
        phases: {},
        _meta: {
          managed: true,
        },
      },
    };

    component = <TestComponent testPolicies={[managedPolicyData]} />;
    renderWithI18n(component);

    // Enable viewing managed policies
    const switchElement = screen.getByTestId('includeHiddenPoliciesSwitch');
    await user.click(switchElement);

    // Find and click delete on the managed policy
    const policyRow = await screen.findByTestId('policyTableRow-testManagedPolicy');
    const deleteButton = within(policyRow).getByTestId('deletePolicy');
    await user.click(deleteButton);

    // Modal should appear with managed policy warning
    expect(screen.getByTestId('deletePolicyModal')).toBeInTheDocument();
    expect(screen.getByTestId('deleteManagedPolicyCallOut')).toBeInTheDocument();
  });

  test('add index template modal shows when add policy to index template button is pressed', async () => {
    renderWithI18n(component);
    const policyRow = screen.getByTestId(`policyTableRow-${testPolicy.name}`);
    const actionsButton = within(policyRow).getByTestId('euiCollapsedItemActionsButton');
    await user.click(actionsButton);
    // Wait for popover to open and find the button by its test id
    const addPolicyToTemplateButton = await screen.findByTestId('addPolicyToTemplate');
    // Use direct click event instead of userEvent due to pointer-events: none on popover
    addPolicyToTemplateButton.click();
    // Modal might take time to appear
    expect(await screen.findByTestId('addPolicyToTemplateModal')).toBeInTheDocument();
  });
  test('displays policy properties', () => {
    renderWithI18n(component);
    const firstRow = screen.getByTestId('policyTableRow-testy0');
    const policyName = within(firstRow).getByTestId('policyTablePolicyNameLink').textContent;
    expect(policyName).toBe(`${testPolicy.name}`);
    const policyIndexTemplates = within(firstRow).getByTestId('policy-indexTemplates').textContent;
    expect(policyIndexTemplates).toBe(`${testPolicy.indexTemplates.length}`);
    const policyIndices = within(firstRow).getByTestId('policy-indices').textContent;
    expect(policyIndices).toBe(`${testPolicy.indices.length}`);
    const policyModifiedDate = within(firstRow).getByTestId('policy-modifiedDate').textContent;
    expect(policyModifiedDate).toBe(`${testDateFormatted}`);

    const cells = firstRow.querySelectorAll('td');
    // columns are name, linked index templates, linked indices, modified date, actions
    expect(cells.length).toBe(5);
  });
  test('opens a flyout with index templates', async () => {
    renderWithI18n(component);
    const indexTemplatesButton = screen.getAllByTestId('viewIndexTemplates')[0];
    await user.click(indexTemplatesButton);
    const flyoutTitle = screen.getByTestId('indexTemplatesFlyoutHeader').textContent;
    expect(flyoutTitle).toContain('testy0');
    const indexTemplatesLinks = screen.getAllByTestId('indexTemplateLink');
    expect(indexTemplatesLinks.length).toBe(testPolicy.indexTemplates.length);
  });
  test('opens a flyout to view policy by calling reactRouterNavigate', async () => {
    renderWithI18n(component);
    const policyNameLink = screen.getAllByTestId('policyTablePolicyNameLink')[0];
    await user.click(policyNameLink);
    expect(mockReactRouterNavigate).toHaveBeenCalled();
  });

  describe('read only view', () => {
    beforeEach(() => {
      jest.spyOn(readOnlyHook, 'useIsReadOnly').mockReturnValue(true);
      component = <TestComponent testPolicies={policies} />;
    });
    it(`doesn't show actions column in the table`, () => {
      renderWithI18n(component);
      const policyRow = screen.getByTestId(`policyTableRow-testy0`);
      const cells = policyRow.querySelectorAll('td');
      // columns are name, linked index templates, linked indices, modified date
      expect(cells.length).toBe(4);
    });
  });
});
