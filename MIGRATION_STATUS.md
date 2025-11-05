# Snapshot & Restore RTL Migration Status

## Completed ✅

### Helper Files (100% Complete)
All helper files have been successfully migrated from Enzyme to React Testing Library:

- ✅ `setup_environment.tsx` - Added `renderWithRouter` with userEvent configuration
- ✅ `home.helpers.ts` - Converted to RTL with screen/within queries
- ✅ `policy_add.helpers.ts` - Migrated to use renderWithRouter
- ✅ `policy_edit.helpers.ts` - Migrated to use renderWithRouter
- ✅ `policy_form.helpers.ts` - Converted actions to async userEvent
- ✅ `policy_list.helpers.ts` - Table interactions using RTL queries
- ✅ `repository_add.helpers.ts` - Migrated with async actions
- ✅ `repository_edit.helpers.ts` - Simplified to use renderWithRouter
- ✅ `restore_snapshot.helpers.ts` - All toggle actions converted to async
- ✅ `snapshot_list.helpers.ts` - Search interactions with userEvent
- ✅ `index.ts` - Updated exports to remove Enzyme dependencies

### Test Files (3/8 Complete - 37.5%)
- ✅ `policy_list.test.tsx` (104 lines) - Fully migrated
- ✅ `restore_snapshot.test.ts` (167 lines) - Fully migrated
- ⏳ `policy_edit.test.ts` (226 lines) - **NEXT TO DO**

### Infrastructure
- ✅ Added `renderWithRouter` helper with proper userEvent setup
- ✅ Removed Enzyme dependencies from helper exports
- ✅ All helpers now return RTL RenderResult with userEvent

## Remaining Work 🚧

### Test Files (5 remaining - ~2480 lines)

#### Priority 1: Simpler Tests
1. **policy_edit.test.ts** (226 lines)
   - Remove `testBed.component.find(PolicyForm)` pattern
   - Replace `.exists()` with `screen.queryByTestId()`
   - Replace `.find().text()` with `toHaveTextContent()`
   - Remove all `component.update()` calls
   - Make actions async with await

2. **repository_edit.test.tsx** (314 lines)
   - Similar patterns to policy_edit
   - Convert form validation tests to RTL

#### Priority 2: Complex Tests  
3. **policy_add.test.ts** (390 lines)
   - Large form validation suite
   - Multiple steps with navigation
   - Form field interactions need userEvent

4. **snapshot_list.test.tsx** (543 lines)
   - Table interactions
   - Search functionality
   - Pagination tests

5. **repository_add.test.ts** (639 lines)
   - Multi-step form
   - Repository type selection
   - Complex validation logic

6. **home.test.ts** (937 lines - MOST COMPLEX)
   - Multiple tabs
   - Repository and snapshot tables
   - Detail panels
   - Modal interactions
   - Navigation between views

## Migration Patterns

### Common Replacements

#### 1. Remove Enzyme Patterns
```typescript
// ❌ OLD (Enzyme)
import { act } from 'react-dom/test-utils';
testBed.component.update();
await act(async () => { testBed = await setup(httpSetup); });

// ✅ NEW (RTL)
import { screen, waitFor } from '@testing-library/react';
testBed = setup(httpSetup); // No async, no act needed
```

#### 2. Existence Checks
```typescript
// ❌ OLD
const { exists } = testBed;
expect(exists('myElement')).toBe(true);
expect(exists('myElement')).toBe(false);

// ✅ NEW
expect(screen.getByTestId('myElement')).toBeInTheDocument();
expect(screen.queryByTestId('myElement')).not.toBeInTheDocument();
```

#### 3. Text Content
```typescript
// ❌ OLD
const { find } = testBed;
expect(find('myElement').text()).toEqual('Hello');

// ✅ NEW
expect(screen.getByTestId('myElement')).toHaveTextContent('Hello');
```

#### 4. Click Actions
```typescript
// ❌ OLD
find('myButton').simulate('click');

// ✅ NEW
const { user } = testBed;
await user.click(screen.getByTestId('myButton'));
```

#### 5. Form Inputs
```typescript
// ❌ OLD
form.setInputValue('nameInput', 'value');
find('nameInput').simulate('blur');

// ✅ NEW
const { user } = testBed;
const input = screen.getByTestId('nameInput');
await user.clear(input);
await user.type(input, 'value');
await user.tab(); // or user.click elsewhere for blur
```

#### 6. Wait for Async Changes
```typescript
// ❌ OLD
component.update();

// ✅ NEW
await waitFor(() => {
  expect(screen.getByTestId('element')).toBeInTheDocument();
});
```

#### 7. Table Interactions
```typescript
// ❌ OLD
const { rows } = table.getMetaData('myTable');
const link = findTestSubject(rows[0].reactWrapper, 'myLink');

// ✅ NEW
import { within } from '@testing-library/react';
const table = screen.getByTestId('myTable');
const rows = within(table).getAllByRole('row');
const link = within(rows[1]).getByTestId('myLink'); // rows[0] is header
```

## Verification Steps

After completing test migrations:

### 1. Linter
```bash
node scripts/eslint --max-warnings=0 x-pack/platform/plugins/private/snapshot_restore
```

### 2. Type Check
```bash
node scripts/type_check --project x-pack/platform/plugins/private/snapshot_restore/tsconfig.json
```

### 3. Run Tests
```bash
yarn test:jest x-pack/platform/plugins/private/snapshot_restore
```

### 4. Push to Branch
```bash
git push origin cursor/migrate-snapshot-and-restore-to-rtl-5863
```

## Notes

- All helpers are now async, so remember to `await` all action calls
- Use `jest.useFakeTimers()` / `jest.useRealTimers()` in test suites that need timer control
- For debounced searches, use `await jest.advanceTimersByTimeAsync(500)`
- Modal interactions may need `waitFor` to ensure they're rendered
- Table row indexing: remember rows[0] is the header, data starts at rows[1]

## Commits Made

1. `feat: migrate Snapshot & Restore test helpers to RTL` - All helper files migrated
2. `feat: migrate policy_list and restore_snapshot tests to RTL` - 2 test files completed

## Branch

`cursor/migrate-snapshot-and-restore-to-rtl-5863` (pushed to remote)
