# Material Combobox Refactor — Design Spec

## Problem

The order creation modal (`OrderFormModal.tsx`) uses a custom `<Input>`-based combobox (`ComboboxFieldMaterial`) for material selection in order items. This component:

- Uses a manual `searchValue` state + custom filtering instead of cmdk's built-in `CommandInput`
- Has a custom `onBlur` handler that closes the popover, causing race conditions with `onSelect`
- Manually handles keyboard events (ArrowDown, Enter, Escape) that cmdk already handles
- Is ~168 lines for what should be a standard shadcn combobox

## Solution

Refactor `ComboboxFieldMaterial` to use the standard shadcn combobox pattern (Button trigger + `CommandInput`), matching the same pattern used by `ComboboxField` for clients/cities/carriers.

## Changes

### 1. `src/components/ComboboxFieldMaterial.tsx`

- **Trigger**: Replace `<Input>` with `<Button variant="outline" role="combobox">` — shows selected material name or "Buscar material..." placeholder
- **Filtering**: Replace manual `searchValue` + `shouldFilter={false}` + custom filter with `<CommandInput placeholder="Buscar material..." />`
- **Keyboard handling**: Remove all custom keyboard event handlers (ArrowDown, Enter, Escape) — `CommandInput` + cmdk handle these natively
- **Selection**: Keep `Popover`/`Command`/`CommandGroup`/`CommandItem`/`Check` pattern unchanged
- **Category grouping**: Keep `CommandGroup` headings with styled badges (`bg-slate-100 text-blue-800`)
- **Props interface**: Unchanged (`field`, `groupedMaterials`)

### 2. `src/components/OrderFormModal.tsx`

- No changes needed — already imports `ComboboxFieldMaterial` and passes `field` + `groupedMaterials`

## Component State (after refactor)

~95 lines, standard shadcn combobox with category grouping. Same visual output, simpler internals.

## Risks

- `CommandItem value` must match what `CommandInput` filters against: uses `${m.name} ${m.width || ""}` so user can search by name or width
- `PopoverContent` must keep `onCloseAutoFocus={(e) => e.preventDefault()}` to prevent focus jump
