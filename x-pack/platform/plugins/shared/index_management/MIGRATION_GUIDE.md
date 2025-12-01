# Enzyme to RTL Migration Guide

This guide documents the patterns for migrating Index Management tests from Enzyme with TestBed architecture to React Testing Library (RTL).

## Reference Implementation

The ILM plugin migration (#242062) serves as the canonical reference for this exact migration pattern.

## Migration Status

### ✅ Completed Migrations (4 files)
1. `__jest__/client_integration/index_details_page/semantic_text_bannner.test.tsx` - Simple registerTestBed pattern
2. `__jest__/client_integration/index_details_page/trained_models_deployment_modal.test.tsx` - registerTestBed with context mocks
3. `public/application/components/mappings_editor/components/document_fields/search_fields/search_result.test.tsx` - mountWithIntl pattern
4. `public/application/components/mappings_editor/components/document_fields/search_fields/search_result_item.test.tsx` - mountWithIntl pattern

### ⏳ Remaining Migrations (~26 files)

See "Remaining Files to Migrate" section below for complete list.

## Quick Reference

| Old (Enzyme) | New (RTL) |
|---|---|
| `import { registerTestBed, mountWithIntl } from '@kbn/test-jest-helpers'` | `import { renderWithI18n } from '@kbn/test-jest-helpers'` |
| `import { screen, fireEvent } from '@testing-library/react'` | Add this import |
| `const testBed = await setup(httpSetup);` | `renderWithI18n(<Component {...props} />);` |
| `testBed.exists('id')` | `screen.queryByTestId('id') !== null` |
| `testBed.find('id')` | `screen.getByTestId('id')` |
| `find('id').text()` | `screen.getByTestId('id').textContent` |
| `find('btn').simulate('click')` | `fireEvent.click(screen.getByTestId('btn'))` |
| `expect(exists('id')).toBe(true)` | `expect(screen.getByTestId('id')).toBeInTheDocument()` |
| `expect(find('id').text()).toContain('x')` | `expect(screen.getByTestId('id')).toHaveTextContent('x')` |
| `tree.find('Component').find('[data-test-subj="id"]').last().text()` | `screen.getByTestId('id').textContent` |

## Common Gotchas

1. **VirtualList components** may not render `data-test-subj` on the container element. Look for child elements.
2. **Multiple elements**: Use `getAllByTestId` or scope with `within()`.
3. **Storage mocks**: Mock `localStorage.getItem` for components that use it.
4. **Text matching**: Use `toHaveTextContent` instead of `.textContent` comparison.
5. **Disabled buttons**: Use `toBeDisabled()` matcher instead of checking props.

## Migration Patterns

### Pattern 1: Simple registerTestBed

**Before:**
```typescript
import { registerTestBed } from '@kbn/test-jest-helpers';

const setup = registerTestBed(Component, {
  defaultProps: { prop: value },
  memoryRouter: { wrapComponent: false },
});
const testBed = setup();
const { exists, find } = testBed;

expect(exists('selector')).toBe(true);
find('button').simulate('click');
```

**After:**
```typescript
import { screen, fireEvent } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

renderWithI18n(<Component prop={value} />);

expect(screen.getByTestId('selector')).toBeInTheDocument();
fireEvent.click(screen.getByTestId('button'));
```

### Pattern 2: mountWithIntl

**Before:**
```typescript
import { mountWithIntl } from '@kbn/test-jest-helpers';

const tree = mountWithIntl(<Component {...props} />);

expect(tree.find('[data-test-subj="id"]').exists()).toBe(true);
expect(tree.find('[data-test-subj="id"]').text()).toEqual('text');
```

**After:**
```typescript
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

renderWithI18n(<Component {...props} />);

expect(screen.getByTestId('id')).toBeInTheDocument();
expect(screen.getByTestId('id')).toHaveTextContent('text');
```

### Pattern 3: Tests with Helpers (Complex)

**Before (helper file):**
```typescript
export const setup = async (httpSetup: HttpSetup) => {
  const initTestBed = registerTestBed(
    WithAppDependencies(Component, httpSetup),
    testBedConfig
  );
  const testBed = await initTestBed();
  
  const selectTab = (tab: string) => testBed.find(tab).simulate('click');
  
  return { ...testBed, actions: { selectTab } };
};
```

**After (inline in test):**
```typescript
renderWithI18n(
  <WithAppDependencies httpSetup={httpSetup}>
    <Component />
  </WithAppDependencies>
);

// Instead of: actions.selectTab('tab')
fireEvent.click(screen.getByTestId('tab'));
```

## Migration Checklist

- [ ] Update imports (remove registerTestBed/mountWithIntl, add renderWithI18n and RTL)
- [ ] Replace setup functions with direct renderWithI18n calls
- [ ] Replace exists() with screen.queryByTestId()
- [ ] Replace find() with screen.getByTestId()
- [ ] Replace .simulate() with fireEvent.*
- [ ] Remove .update() calls (not needed)
- [ ] Remove manual act() wrapping (RTL does this)
- [ ] Inline custom actions or convert to RTL utilities
- [ ] Test: `yarn test:jest path/to/file.test.tsx`
- [ ] Lint: `node scripts/eslint --fix path/to/file.test.tsx`
- [ ] Remove helper file if only for testbed setup

## Remaining Files to Migrate (~26)

### Home Tests (6 files)
- [ ] home/home.test.ts + home.helpers.ts
- [ ] home/indices_tab.test.tsx + indices_tab.helpers.ts
- [ ] home/data_streams_tab.test.ts + data_streams_tab.helpers.ts
- [ ] home/data_streams_project_level_retention.test.ts
- [ ] home/index_templates_tab.test.ts + index_templates_tab.helpers.ts
- [ ] home/enrich_policies.test.tsx + enrich_policies.helpers.ts

### Template Wizard (3 files)
- [ ] index_template_wizard/template_create.test.tsx + helpers
- [ ] index_template_wizard/template_edit.test.tsx + helpers
- [ ] index_template_wizard/template_clone.test.tsx + helpers

### Other Integration Tests (2 files)
- [ ] index_details_page/index_details_page.test.tsx + helpers
- [ ] create_enrich_policy/create_enrich_policy.test.tsx + helpers

### Component Templates (4 files)
- [ ] component_templates/.../component_template_list.test.ts + helpers
- [ ] component_templates/.../component_template_create.test.tsx + helpers
- [ ] component_templates/.../component_template_edit.test.tsx + helpers
- [ ] component_templates/.../component_template_details.test.ts + helpers

### Mappings Editor (12 files)
- [ ] mappings_editor/.../mappings_editor.test.tsx + helpers
- [ ] mappings_editor/.../mapped_fields.test.tsx + helpers
- [ ] mappings_editor/.../runtime_fields.test.tsx + helpers
- [ ] mappings_editor/.../edit_field.test.tsx + helpers
- [ ] mappings_editor/.../configuration_form.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/text_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/date_range_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/point_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/shape_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/scaled_float_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/version_datatype.test.tsx + helpers
- [ ] mappings_editor/.../datatypes/other_datatype.test.tsx + helpers
- [ ] mappings_editor/components/load_mappings/load_mappings_provider.test.tsx

### Misc (2 files)
- [ ] __jest__/components/index_table.test.js
- [ ] public/application/lib/discover_link.test.tsx

## Tips

1. Start with simpler tests without routing/redux
2. Test each migration before continuing
3. Check component source for actual test subjects
4. Use within() for scoped queries
5. Run tests incrementally during migration
