# Enzyme to RTL Migration - Progress Summary

## Overview

This document summarizes the progress on migrating Index Management plugin tests from Enzyme with testbed architecture to React Testing Library (RTL).

## Completed Work

### Migrated Files (4 of ~30)

1. **semantic_text_banner.test.tsx**
   - Pattern: Simple registerTestBed → renderWithI18n
   - Complexity: Low (no helpers, no context)
   - Tests: 5 passing
   - Status: ✅ Complete, tested, linted

2. **trained_models_deployment_modal.test.tsx**
   - Pattern: registerTestBed with context mocks → renderWithI18n  
   - Complexity: Medium (context hooks, beforeEach setup)
   - Tests: 9 passing
   - Status: ✅ Complete, tested, linted

3. **search_result.test.tsx**
   - Pattern: mountWithIntl → renderWithI18n
   - Complexity: Low (StateProvider wrapper)
   - Tests: 2 passing
   - Status: ✅ Complete, tested, linted

4. **search_result_item.test.tsx**
   - Pattern: mountWithIntl → renderWithI18n
   - Complexity: Low (StateProvider wrapper)
   - Tests: 4 passing
   - Status: ✅ Complete, tested, linted

### Documentation Created

**MIGRATION_GUIDE.md** - Comprehensive migration guide with:
- Quick reference table (old → new patterns)
- 3 detailed migration patterns with examples
- Common gotchas and tips
- Step-by-step checklist
- Complete file inventory (~26 remaining files)
- Before/after code examples from actual migrations

## Pattern Coverage

### ✅ Demonstrated Patterns

1. **Simple registerTestBed**
   - Remove testbed setup
   - Replace with direct renderWithI18n
   - Convert exists/find to screen queries
   - Replace simulate with fireEvent

2. **registerTestBed with Context Mocks**
   - Preserve context mock setup
   - Convert render function
   - Replace testbed queries with screen
   - Handle beforeEach patterns

3. **mountWithIntl**
   - Replace with renderWithI18n
   - Convert tree.find() to screen queries
   - Handle nested component queries
   - Replace .text() with .textContent or toHaveTextContent

### ⏳ Documented But Not Implemented

4. **Complex Helper Files**
   - Pattern documented in guide
   - Shows how to inline actions
   - Demonstrates WithAppDependencies usage
   - Ready for implementation

## Remaining Work

### File Inventory (~26 files)

**Home Tests (6 files) - Priority 1**
- home.test.ts + home.helpers.ts
- indices_tab.test.tsx + indices_tab.helpers.ts
- data_streams_tab.test.ts + data_streams_tab.helpers.ts
- data_streams_project_level_retention.test.ts
- index_templates_tab.test.ts + index_templates_tab.helpers.ts
- enrich_policies.test.tsx + enrich_policies.helpers.ts

**Template Wizard (3 files) - Priority 2**
- template_create.test.tsx + helpers
- template_edit.test.tsx + helpers
- template_clone.test.tsx + helpers

**Integration Tests (2 files) - Priority 3**
- index_details_page.test.tsx + helpers
- create_enrich_policy.test.tsx + helpers

**Component Templates (4 files) - Priority 4**
- component_template_list.test.ts + helpers
- component_template_create.test.tsx + helpers
- component_template_edit.test.tsx + helpers
- component_template_details.test.ts + helpers

**Mappings Editor (12 files) - Priority 5**
- mappings_editor.test.tsx + helpers
- mapped_fields.test.tsx + helpers
- runtime_fields.test.tsx + helpers
- edit_field.test.tsx + helpers
- configuration_form.test.tsx + helpers
- 7 datatype tests + helpers
- load_mappings_provider.test.tsx

**Misc (2 files) - Priority 6**
- index_table.test.js
- discover_link.test.tsx

### Estimated Effort

- **Simple tests** (no helpers): ~30 min each
- **Tests with simple helpers**: ~1 hour each
- **Complex tests** (routing, redux, actions): ~2-3 hours each
- **Total estimated**: 40-60 hours

## Quality Standards

All migrations must meet these criteria:

✅ **Tests Pass**
- All existing tests must pass
- No skipped or disabled tests
- No test removals (refactor instead)

✅ **Linting**
- Zero ESLint errors
- Run: `node scripts/eslint --fix <file>`

✅ **Type Checking**
- Zero TypeScript errors
- Run: `node scripts/type_check --project <tsconfig>`

✅ **Patterns**
- Use renderWithI18n (not render)
- Use screen queries (not container queries)
- Use fireEvent for interactions
- No manual act() wrapping
- No .update() calls
- No testbed abstractions

## Migration Workflow

For each file:

1. **Prepare**
   - Read MIGRATION_GUIDE.md pattern
   - Check component for test subjects
   - Identify pattern type

2. **Migrate**
   - Update imports
   - Replace setup/render
   - Convert queries
   - Convert interactions
   - Convert assertions

3. **Verify**
   - Run tests: `yarn test:jest <file>`
   - Lint: `node scripts/eslint --fix <file>`
   - Type-check if needed
   - All must pass with 0 errors

4. **Cleanup**
   - Remove helper file if only testbed
   - Update helper index.ts if needed
   - Remove unused imports

5. **Commit**
   - Descriptive message
   - Include verification results
   - One file or related batch per commit

## Key Learnings

### What Works Well

1. **renderWithI18n** handles i18n automatically
2. **screen queries** are more readable than testbed
3. **fireEvent** is simpler than .simulate()
4. **No wrapper.update()** reduces boilerplate
5. **Direct component rendering** is clearer than testbed abstraction

### Common Issues

1. **VirtualList components** don't pass data-test-subj down
   - Solution: Query for child elements

2. **Multiple elements** with same test-subj
   - Solution: Use getAllByTestId or within()

3. **Storage mocks** needed for localStorage usage
   - Solution: Mock getItem/setItem in beforeEach

4. **Text matching** differs between Enzyme and RTL
   - Solution: Use toHaveTextContent instead of .text()

5. **Disabled state** checking
   - Solution: Use toBeDisabled() instead of .props().disabled

## Reference Materials

### Primary Reference
- **PR #242062**: ILM plugin migration (canonical example)

### Documentation
- **MIGRATION_GUIDE.md**: Complete migration patterns
- **Repository guidelines**: Kibana development guide

### Tools
- `renderWithI18n` from @kbn/test-jest-helpers
- `screen`, `fireEvent`, `waitFor` from @testing-library/react
- `within` for scoped queries

## Completion Criteria

Migration is complete when:

1. ✅ All ~30 test files migrated to RTL
2. ✅ All tests passing
3. ✅ All helper files removed or simplified
4. ✅ helpers/index.ts cleaned up
5. ✅ Zero lint errors
6. ✅ Zero type errors
7. ✅ No registerTestBed usage
8. ✅ No mountWithIntl usage
9. ✅ Code review passed
10. ✅ Security scan passed

## Next Steps

### Immediate
1. Continue with home tests (simplest remaining)
2. Follow patterns from completed migrations
3. Test and verify each file individually

### Medium Term
1. Complete all test file migrations
2. Remove helper infrastructure
3. Update shared test utilities

### Final
1. Remove helpers/index.ts exports for testbed
2. Final verification of all tests
3. Code review and security scan
4. Merge to main

## Contact

For questions or guidance:
- Review MIGRATION_GUIDE.md
- Check completed migration examples
- Reference PR #242062 (ILM migration)
- Consult repository development guidelines

---

**Last Updated**: 2025-12-01
**Status**: In Progress (4 of ~30 files migrated)
**Next Priority**: Home tests (6 files)
