# Enzyme to RTL Migration Guide

This guide documents the patterns for migrating Index Management tests from Enzyme with TestBed architecture to React Testing Library (RTL).

## Reference Implementation

The ILM plugin migration (#242062) serves as the canonical reference for this exact migration pattern.

## Migration Patterns

### Pattern 1: Simple Component Tests (No Helpers)

**Before (Enzyme + TestBed):**
```typescript
import { registerTestBed } from '@kbn/test-jest-helpers';
import { act } from 'react-dom/test-utils';

const setup = registerTestBed(SemanticTextBanner, {
  defaultProps: { isSemanticTextEnabled: true, isPlatinumLicense: true },
  memoryRouter: { wrapComponent: false },
});

const testBed = setup();
const { exists, find } = testBed;

expect(exists('selector')).toBe(true);
find('button').simulate('click');
wrapper.update();
```

**After (RTL):**
```typescript
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

renderWithI18n(<SemanticTextBanner isSemanticTextEnabled={true} isPlatinumLicense={true} />);

expect(screen.queryByTestId('selector')).toBeInTheDocument();
fireEvent.click(screen.getByTestId('button'));
// No need for wrapper.update() - RTL handles this automatically
```

### Pattern 2: Component with Context/Mocks

**Before:**
```typescript
const setup = (defaultProps: Partial<Props>) =>
  registerTestBed(Component, {
    defaultProps,
    memoryRouter: { wrapComponent: false },
  })();

mappingsContextMocked.useMappingsState.mockReturnValue(defaultState);
const { exists, find } = setup({ prop: value });
```

**After:**
```typescript
const renderComponent = (defaultProps: Partial<Props>) => {
  return renderWithI18n(<Component {...(defaultProps as any)} />);
};

mappingsContextMocked.useMappingsState.mockReturnValue(defaultState);
renderComponent({ prop: value });

expect(screen.queryByTestId('selector')).toBeInTheDocument();
```

### Pattern 3: Tests with Helper Files and Actions (Complex)

These tests need more substantial refactoring:

1. **Remove the helper file** or convert it to simple render utilities
2. **Inline custom actions** as RTL queries and interactions
3. **Use WithAppDependencies** wrapper for context if needed
4. **Replace TestBed queries:**
   - `exists('selector')` → `screen.queryByTestId('selector') !== null` or `expect().toBeInTheDocument()`
   - `find('selector')` → `screen.getByTestId('selector')`
   - `find('selector').text()` → `screen.getByTestId('selector').textContent`
   - `find('selector').simulate('click')` → `fireEvent.click(screen.getByTestId('selector'))`

**Before (home.helpers.ts):**
```typescript
export const setup = async (httpSetup: HttpSetup): Promise<HomeTestBed> => {
  const initTestBed = registerTestBed(
    WithAppDependencies(IndexManagementHome, httpSetup),
    testBedConfig
  );
  const testBed = await initTestBed();
  const { find } = testBed;

  const selectHomeTab = (tab: 'indicesTab' | 'templatesTab') => {
    find(tab).simulate('click');
  };

  return {
    ...testBed,
    actions: { selectHomeTab },
  };
};
```

**After (inline in test):**
```typescript
// In test file:
renderWithI18n(
  <WithAppDependencies httpSetup={httpSetup}>
    <IndexManagementHome />
  </WithAppDependencies>
);

// Instead of: actions.selectHomeTab('templatesTab')
// Use: fireEvent.click(screen.getByTestId('templatesTab'))
```

## Common Transformation Rules

### Queries
| Enzyme/TestBed | RTL |
|---|---|
| `exists('id')` | `screen.queryByTestId('id') !== null` |
| `!exists('id')` | `screen.queryByTestId('id') === null` |
| `find('id')` | `screen.getByTestId('id')` |
| `find('id').text()` | `screen.getByTestId('id').textContent` |
| `findTestSubject(wrapper, 'id')` | `screen.getByTestId('id')` |

### Interactions
| Enzyme/TestBed | RTL |
|---|---|
| `find('id').simulate('click')` | `fireEvent.click(screen.getByTestId('id'))` |
| `find('input').simulate('change', { target: { value: 'x' } })` | `fireEvent.change(screen.getByTestId('input'), { target: { value: 'x' } })` |
| `find('checkbox').simulate('change', { target: { checked: true } })` | `fireEvent.click(screen.getByTestId('checkbox'))` |

### Assertions
| Enzyme/TestBed | RTL |
|---|---|
| `expect(exists('id')).toBe(true)` | `expect(screen.queryByTestId('id')).toBeInTheDocument()` |
| `expect(exists('id')).toBe(false)` | `expect(screen.queryByTestId('id')).not.toBeInTheDocument()` |
| `expect(find('id').text()).toContain('x')` | `expect(screen.getByTestId('id')).toHaveTextContent('x')` |
| `expect(find('btn').props().disabled).toBe(true)` | `expect(screen.getByTestId('btn')).toBeDisabled()` |

### Async Operations
| Enzyme/TestBed | RTL |
|---|---|
| `await act(async () => { action(); }); wrapper.update();` | Just do the action - RTL auto-wraps in act |
| Wait for element | `await screen.findByTestId('id')` |
| Wait for condition | `await waitFor(() => expect(...).toBe(...))` |

## Imports to Update

**Remove:**
```typescript
import { registerTestBed, TestBed } from '@kbn/test-jest-helpers';
import { act } from 'react-dom/test-utils';
```

**Add:**
```typescript
import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';
```

## Migration Checklist for Each Test File

- [ ] Remove `registerTestBed` usage
- [ ] Replace `testBed.exists()` with `screen.queryByTestId()`
- [ ] Replace `testBed.find()` with `screen.getByTestId()`
- [ ] Replace `.simulate()` with `fireEvent.*`
- [ ] Remove manual `act()` wrapping (RTL does this automatically)
- [ ] Remove `component.update()` calls (not needed in RTL)
- [ ] Convert custom actions to inline RTL interactions
- [ ] Update imports
- [ ] Run tests to verify
- [ ] Lint and type-check
- [ ] Remove helper file if it only contained testbed setup

## Completed Migrations

✅ `__jest__/client_integration/index_details_page/semantic_text_bannner.test.tsx`
✅ `__jest__/client_integration/index_details_page/trained_models_deployment_modal.test.tsx`

## Files Already Using RTL (No Migration Needed)

- `__jest__/client_integration/index_details_page/select_inference_id.test.tsx`
- `__jest__/client_integration/index_details_page/create_field.test.tsx`
- Many other component tests

## Remaining Files to Migrate

### Priority 1: Test Suites with Helpers
- [ ] `home/home.test.ts` + `home/home.helpers.ts`
- [ ] `home/indices_tab.test.tsx` + `home/indices_tab.helpers.ts`
- [ ] `home/data_streams_tab.test.ts` + `home/data_streams_tab.helpers.ts`
- [ ] `home/data_streams_project_level_retention.test.ts`
- [ ] `home/index_templates_tab.test.ts` + `home/index_templates_tab.helpers.ts`
- [ ] `home/enrich_policies.test.tsx` + `home/enrich_policies.helpers.ts`

### Priority 2: Template Wizard Tests
- [ ] `index_template_wizard/template_create.test.tsx` + helpers
- [ ] `index_template_wizard/template_edit.test.tsx` + helpers
- [ ] `index_template_wizard/template_clone.test.tsx` + helpers

### Priority 3: Index Details & Enrich
- [ ] `index_details_page/index_details_page.test.tsx` + helpers
- [ ] `create_enrich_policy/create_enrich_policy.test.tsx` + helpers

### Priority 4: Component Templates
- [ ] `component_templates/__jest__/client_integration/*` (4 test files + helpers)

### Priority 5: Mappings Editor
- [ ] `mappings_editor/__jest__/client_integration/*` (13 test files + helpers)

## Tips

1. **Start with simpler tests** that don't have complex routing/redux dependencies
2. **Test each migration** before moving to the next
3. **Batch related files** together for efficiency
4. **Keep the WithAppDependencies wrapper** for tests that need full app context
5. **Use `within()` for scoped queries** when needed: `within(screen.getByTestId('panel')).getByText('text')`
6. **Remove helper files after migration** or keep only render utilities
