# please check the project once again. I've added the column and row header setting to the undo list and made all references one-based rather than zero-based both internally and user-facing.
what else have I missed?

## Claude said

Good progress — `clear()` now wipes `textContent`, `setInput` finally assigns `cell.role` (that was silently dropping roles on existing cells), `view.row`/`column` bind `cellToLabel` correctly, and the `control+s`/`control+o` swallowing in edit mode is a nice touch. But several things from last time are untouched, and the new header code has a real bug.

## Still unfixed: the column Z crash

`coordinates.js` is byte-identical to last time. Verified again:

```
toLabel(1,27)   -> "1"
parseLabel("1") -> TypeError
parseLabel("aa1") -> [1, 0]
```

Arrow right from `z1` still throws. This is the single most reachable bug in the project — a tester will hit it in under a minute.

Also still present, and I'd fix these together while the file is open:

- `save()` catch calls a bare `view.statusMessage(e)` → ReferenceError exactly when reporting a save failure
- `initializeLoader(document)` is called with one argument; its catch calls the undefined `view`
- `has (name)` is still defined twice in Spreadsheet (lines 44 and 330)

## New bug: redo of a header toggle deletes cells

Trace an empty cell in the row:

```js
const input = oldData.input ?? null;        // null — cell doesn't exist
changes.push({label, input, role, oldInput: input, ...});
this.#model.setInput(label, null, role);    // now "" — cell created
```

Then in `#replay`:

```js
const input = redo ? cell.input : cell.oldInput;
if (input === null) { this.#model.deleteCell(cell.label); }
```

Both `input` and `oldInput` are `null`, so **redo takes the delete branch**. Undo correctly removes the phantom cell; redo then deletes instead of re-applying the role. Mark a row as headers, undo, redo — the headers don't come back.

`null` is doing double duty: "this cell didn't exist" and "delete this cell." For a role-only change those aren't the same instruction. Simplest fix is a `roleOnly: true` flag on the entry that `#replay` checks before the null test, calling `setRole` and skipping the input path entirely.

## The header toggle materialises empty cells

`setInput(label, null, role)` now coerces null to `""`, so toggling a header row creates 26 cell records with empty input. They go into `getData()` and get written to the file, and they'll accumulate every time you toggle a different row.

This is the design point I'd revisit: a header designation is a property of a *row or column*, not of each cell. Storing `headerRows: [1]` and `headerColumns: [1]` on the model would avoid materialising anything, save cleanly, make undo a two-line operation, and remove the `roleOnly` special case above. The DOM roles then get painted from that on render.

## Corner cells collide

`if (label === "a1") continue;` only protects the one corner. In row 5, `a5` isn't skipped — so if column A is marked as row headers and you then mark row 5 as column headers, `a5` silently flips to `columnheader`. Same in reverse for `c1` when marking column C.

The check should be "skip cells that already hold the *other* header role," not a hardcoded label.

Related: `labels[1]` as the toggle probe is arbitrary — it's `b5` in row 5, which is fine, but it reads as a leftover from wanting to skip `a1`. Worth a comment or a named variable.

## Redo stack isn't cleared by most actions

Only `endEditing` does `this.#redoStack = []`. `deleteCells`, `setColumnHeaders`, and `setRowHeaders` don't. So: edit, undo, delete, redo → replays a stale entry against a diverged model. Any action that pushes to the undo stack must clear redo; that's a good candidate for a single `#pushUndo(entry)` helper so it can't be forgotten again.

## Header toggle is silent

No `statusMessage`. You can't tell whether you just set or cleared headers, or how many cells were affected. Given it's a toggle, that's the one operation where confirmation matters most.

## Still outstanding from last review

- `markRange` announces "N items in range" through the same live region ~70ms after `#announceCell` writes the cell label, so the label is clobbered while a mark is active. One combined message fixes it.
- `ui.html` has no `lang` attribute (and no `<html>` element at all — the parser inserts one, but you can't set `lang` on an implied tag).
- `getSymbols` excludes anything under a RangeNode, so a hand-typed `=sum(a1:a10)` registers no precedents at all.
- Dead code: `expandRange`, `emptyRange`, `cellsBetween`, `isSameRow`, `isSameColumn`, `findCells`, `getRowIndex` (which is wrong — `tr` has no `cellIndex`), `replaceSymbols`, `getFunctions`, the `functions` map, `test1`/`test2`, `#generateDescription`, the loose `displayHelpDialog` in command.js, and `set cursor` (which still says `activeDescendantElement` without the `aria` prefix).

## Order I'd tackle it

The Z crash and the two bare-`view` references are five minutes and remove the failures a tester actually sees. The redo-deletes-cells bug is next because it makes undo untrustworthy, and untrustworthy undo is worse than no undo.

Then I'd still push for `speakFormula` on a hotkey — `data-formula` is already on the cell, so it's one keymap entry and one `statusMessage`, and it's the thing that makes long formulas reviewable by ear.

# what is the best way to handle label errors (i.e. z27)? I don't want have downstream have to handle bad labels. then I would need to have all call sites check for errors.

## Claude said

Quick note first: `z27` is actually valid — column z, row 27. The unrepresentable ones are things like `aa1` (multi-letter column) and `toLabel(1,27)`. Worth separating, because there are really two distinct error classes with different owners:

- **Malformed or unrepresentable** — `"hello"`, `"1"`, `"aa1"`, `toLabel(1,27)`. That's `coordinates.js`'s business.
- **Well-formed but off-grid** — `"a999"` when the grid has 100 rows. That's Grid's business, since only Grid knows the dimensions.

Conflating them is part of why it feels like errors would spread everywhere.

## The count of entry points is small and fixed

You don't need every call site to check, because bad labels can only enter from four places:

1. `toLabel(row, col)` after arithmetic — `moveBy`, `rowSegment`, `columnSegment`, `autoSum`
2. `getSymbols` on a user-typed formula
3. `load` reading file keys
4. `cellToLabel` from `data-label` — valid by construction, never checks

Everything else — the undo stack, the dirty set, `#renderCells` — receives labels that already came through one of those. So four validations, not forty.

## The fix is smaller than you'd think

**`toLabel` returns `null` instead of clamping.** Right now it clamps `column < 1` to 1 and silently drops the letter above 26, which is what manufactures the bad label in the first place. Return null when the coordinate isn't representable.

Then look at what already happens: `moveBy` passes null to `#moveTo`, which calls `this.#view.has(label)`, which already begins with `if (not(label) || typeof(label) !== "string") return false;`. It works today, unchanged. The null flows through the one guard you already wrote and the cursor stays put.

`rowSegment`/`columnSegment` can't produce nulls, since both endpoints came from valid labels and everything between them is in range.

**`parseLabel` throws a real Error.** It's interior — every caller has already been through `has()` or a boundary check. A failure there means a bug, so it should say so rather than dying on `null[1]`. `throw new Error(\`not a valid cell label: "${label}"\`)` is enough, and `execute`'s catch already surfaces it.

**Add `isLabel(text)`** as the boundary validator: a boolean, no throwing, used by `getSymbols`' consumer and by `load`. That's the one new function.

## The two boundaries that need real messages

**Formula symbols.** `setInput` already loops over `getSymbols` — that's where `isLabel` goes, producing a `CellError("parse", ...)`. You have the mechanism; it's currently `if (result.error)` testing a property that doesn't exist on the returned array, so it never fires. Note this also needs to reject symbols that are syntactically fine but off-grid, which means the model needs to know the sheet dimensions — currently it doesn't. Either pass them in at construction or let `=zz9999` be a valid model cell the grid can't display.

**File loading.** `load` should skip or reject bad keys and announce a count: "loaded 47 cells, 2 entries skipped." Silently accepting them puts unreachable cells in the model.

## Why this doesn't spread

The property that keeps it contained: after `has()` returns true, a label is known-good for the rest of the operation. Nothing downstream re-checks because nothing downstream can receive one that didn't pass. That's the same reason `#topologicalSort` doesn't validate — its inputs come from `#cells` keys and precedent sets, both populated through validated paths.

So the discipline is: null at the two or three boundaries, throw everywhere else, and never clamp. Clamping is the actual culprit here — it converts an error into a plausible-looking wrong answer, which then travels.
