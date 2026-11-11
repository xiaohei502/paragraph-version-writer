# Export regression checks

Production change: JSON export synchronizes the selected version editor before serialization. This also covers the existing Ctrl/Cmd+S handler. It does not change which version is displayed.

## Dependency-free unit tests

Run `node --test export-unit.test.cjs` (Node.js 18+).
The tests execute the actual functions extracted from index.html, using editor/state stubs. Covers immediate edits, blank content, blank names, Unicode/multiline text, repeated exports, preserving non-selected versions and display selection, and no selected version.

Baseline: 3 failed, 1 passed. Fixed: 4 passed.

## Browser regression tests

With Playwright installed and Chromium available, run `node --test export.test.cjs`.
Set CHROMIUM_PATH if Chromium is not at /usr/bin/chromium.
Tests exercise the button, Ctrl+S, and Cmd+S, including a non-display draft, repeated export, and main-editor updates.

These browser checks were attempted but did not run: Chromium failed to launch because the execution environment denied socket creation. They are not reported as passed.

No existing lint/build/test configuration was present in the source repository.

## Draft navigation regression

Run `node --test editor-sync.test.cjs export-unit.test.cjs`.
The editor synchronization tests execute the actual input bindings and synchronization function using stubs, then replace selection/editor values as navigation does. Before the fix both draft tests failed; afterwards all six unit tests passed. This is a unit-level reproduction, not browser end-to-end coverage.

Input now updates the current version in memory immediately, without rerendering or changing focus/caret. This protects drafts when switching versions, paragraphs or chapters. It does not add persistence across page reloads; exporting JSON is still required for a durable backup.

## Side-panel/central-editor consistency

Run `node --test export-unit.test.cjs editor-sync.test.cjs editor-mirror.test.cjs`.
The new regression reproduces a side-panel edit to the displayed version leaving stale text in the central editor, which would overwrite the newer content on the next central input. The displayed-version case failed before the fix; all eight unit tests now pass. A non-display draft remains isolated and other paragraphs are untouched.

The input handler now updates only the matching central textarea when editing its displayed version, plus statistics. It does not rebuild either editor or change focus. A browser scenario was added to export.test.cjs; all four browser scenarios were attempted again but Chromium still failed to launch due to denied socket creation, so browser behavior remains unverified.
