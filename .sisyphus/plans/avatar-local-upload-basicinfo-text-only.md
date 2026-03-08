# Avatar Local Upload + BasicInfo Text-Only

## 1. Project Goal
Ship a focused update to the single-file resume editor in `简历.html` that replaces avatar URL entry with local image upload, adds manual avatar framing control inside the circular preview, and simplifies `basicInfo` so each item only contains icon + content, with no link field or link rendering.

## 2. MVP Scope
- Replace the `profileImage` text input with local file upload UX.
- Persist the uploaded avatar across reloads and JSON export/import.
- Accept only `.png`, `.jpg`, `.jpeg`, and `.webp` files.
- Reject files larger than 2 MB with explicit status feedback.
- Keep avatar rendering inside the existing fixed-size preview block.
- Keep this slice focused on avatar replacement upload only; do not add separate avatar-management features beyond the requested upload behavior.
- Add deterministic manual avatar framing controls so the user can adjust which area is visible inside the circular avatar.
- Persist avatar framing state across reloads and JSON export/import.
- Remove `basicInfo.url` from the normalized schema, form UI, preview rendering, draft persistence, and JSON export/import.
- Render all `basicInfo` values as plain text only.
- Preserve existing `basicInfo` ordering, icon selection, custom icon behavior, hide-empty behavior, and pagination/print behavior.

## 3. Out of Scope
- Any compatibility layer for legacy drafts or imported JSON containing URL-based avatar assumptions or `basicInfo[].url`.
- Backend upload, cloud storage, IndexedDB, or multi-file refactors.
- Visual redesign of the form, preview, or print layout.
- Automatic image compression, resizing, cropping, or SVG support.
- Freeform crop-box editing, rotation, or gesture-heavy image editing UI.
- New `basicInfo` fields, inferred links, or contact-type-specific behavior.
- Changes to the active `ats-ux-short-batch` plan beyond keeping this work as a separate plan slice.

## 4. Core User or System Flows
1. User opens the page and sees the existing avatar preview plus a local upload control instead of an avatar URL field.
2. User uploads a valid image file and the preview updates immediately.
3. User adjusts avatar framing so a full-body or off-center photo can show the desired head area within the circular frame.
4. User refreshes the page and sees the same uploaded avatar and framing restored from persisted draft data.
5. User exports JSON and the exported payload contains the persisted avatar and framing state in the new supported form.
6. User imports a valid JSON payload produced by the new schema and the avatar/basic info render correctly.
7. User enters or reorders `basicInfo` items and sees icon + plain text only, with no clickable links in preview.
8. User uploads an invalid or oversized file and gets a deterministic error message while the previous valid avatar remains intact.
9. User prints from the button path and the avatar/basic info still render correctly in preview/print.

## 5. Technical Approach
- Keep `profileImage` as a serializable string field in `resumeData`, but change its source from remote URL entry to locally uploaded image data.
- Use browser-side file reading to convert accepted images into a persisted `data:image/*` string so the existing JSON/localStorage model remains viable.
- Treat avatar upload as successful only after draft persistence succeeds; if persisting the data URL fails, restore the previous avatar value and show an explicit status error instead of silently keeping a non-persistent preview.
- Keep the fallback avatar path for missing or broken avatar data.
- Store avatar framing as serializable numeric metadata alongside `profileImage` so framing survives draft persistence and JSON round-trips.
- Use a deterministic framing UI as the default interaction model: zoom + horizontal/vertical position controls, rather than a freeform crop modal.
- Remove `url` from `BASIC_INFO_PRESETS`, `normalizeBasicInfoList`, and downstream form/render usage.
- Simplify `renderBasicInfo()` so it always outputs icon + text and never creates anchor tags.
- Extend the current event/action model with explicit avatar upload handling instead of relying on generic text-field updates.
- Keep all work in `简历.html` unless test fixtures or evidence files are needed during execution.

## 6. Architecture or Module Breakdown
- `sampleResumeData` / `BASIC_INFO_PRESETS`: remove `basicInfo.url` from default schema and extend avatar defaults to include framing metadata alongside the persisted image field.
- `normalizeBasicInfoList()` / `normalizeResumeData()`: normalize the new text-only `basicInfo` shape plus avatar image/framing expectations.
- `renderBasicForm()`: replace avatar URL input with file input and framing controls plus related helper/status text.
- `renderBasicInfo()`: remove link generation and render plain text only.
- `buildLeftColumnBlocks()` / preview avatar block: continue using the existing fixed-size avatar container while applying persisted framing values to the avatar image.
- `applyFieldUpdate()` / `handleAction()`: keep generic text handling for other fields and add explicit avatar-upload/framing handling where needed.
- `saveDraft()` / `loadDraft()` / import/export flow: preserve round-trip behavior under the new schema.

## 7. Milestones and Order of Work
### M1. Lock schema and test harness
- Add stable selectors/hooks needed for avatar upload and `basicInfo` verification.
- Define the new avatar persistence + framing rule and text-only `basicInfo` contract in code-facing tests/checks.
- Add test fixtures for valid image, oversized image, and invalid file cases.
- Test tool: Playwright over local HTTP (`python -m http.server 4173` or equivalent) against `http://127.0.0.1:4173/%E7%AE%80%E5%8E%86.html`.
- Fixture paths to create during execution:
  - `tests/fixtures/avatar-ok.png`
  - `tests/fixtures/avatar-oversize.jpg`
  - `tests/fixtures/not-image.txt`
  - `tests/fixtures/new-schema-sample.json`
- Stable selectors/data hooks to add before implementation logic:
  - `data-testid="avatar-upload-input"`
  - `data-testid="avatar-preview-image"`
  - `data-testid="avatar-zoom-control"`
  - `data-testid="avatar-offset-x-control"`
  - `data-testid="avatar-offset-y-control"`
  - `data-testid="basic-info-list"`
  - `data-testid="form-status"`
  - `data-testid="export-data"`
- First failing checks to land before feature implementation:
  - uploading `avatar-ok.png` does not yet update `avatar-preview-image`;
  - avatar framing controls do not yet change the visible region deterministically;
  - exported JSON still includes `basicInfo[].url`;
  - `basicInfo` preview still contains anchor tags after the text-only contract is expected.

### M2. Implement avatar local upload and framing controls
- Replace avatar URL entry UI with local upload UI.
- Add file validation and deterministic status messages.
- Persist uploaded avatar to draft and JSON export/import.
- Add deterministic framing controls for zoom and horizontal/vertical position.
- Persist framing state to draft and JSON export/import.
- Preserve fallback behavior and preview rendering.

This milestone is the first implementation gate. M3 does not start until avatar upload validation passes.

### M3. Remove `basicInfo.url`
- Remove the field from defaults, normalization, update flow, export/import round-tripping, and preview rendering.
- Keep icon, custom icon, ordering, and hide-empty behavior intact.

### M4. Regression and validation
- Re-run avatar upload, reload, export/import, `basicInfo`, and print/pagination verification.
- Confirm there are no remaining business-path references to `basicInfo.url` and no preview anchor tags in the basic-info section.

### Atomic Commit Strategy
1. `test: add fixtures and stable selectors for avatar/basic-info flows`
2. `feat: replace avatar URL entry with local upload persistence`
3. `feat: add persisted avatar framing controls`
4. `feat: remove basicInfo links and keep text-only rendering`
5. `test: cover avatar round-trip and basic-info regressions`

Each commit must leave the app runnable and keep JSON import/export working.

## 8. File-Level Change Plan
- `简历.html`
  - Replace avatar input UI in `renderBasicForm()`.
  - Update sample/default schema for avatar image + framing metadata and `basicInfo`.
  - Update normalization paths for avatar persistence/framing expectations and text-only `basicInfo`.
  - Add avatar-specific upload/framing handling and validation.
  - Remove `basicInfo.url`-driven anchor rendering.
  - Preserve preview, pagination, and print hooks.
- Test/evidence artifacts during execution
  - Add local fixtures for valid image / oversized image / invalid file.
  - Add browser checks using the stable selectors defined in M1.
  - Add execution evidence under `.sisyphus/evidence/` matching the new QA scenarios.

## 9. Risks and Rollback Strategy
- Risk: avatar data inflates localStorage/export size too much.
  - Rollback: keep the 2 MB hard limit, reject oversize files, and preserve the previous avatar on failure.
- Risk: upload succeeds visually but does not survive reload/import/export.
  - Rollback: block merge until round-trip tests prove persistence.
- Risk: framing controls are too loose or hard to verify.
  - Rollback: keep the control model deterministic with bounded numeric inputs and assert exact framing-state values in tests.
- Risk: removing `basicInfo.url` leaves stale references in normalization or preview.
  - Rollback: use grep/assertion checks for zero remaining business-path URL usage before completion.
- Risk: print or pagination regresses because avatar state or preview markup changes.
  - Rollback: preserve the existing fixed avatar container and re-run print/pagination checks before completion.
- Risk: invalid files break current state.
  - Rollback: keep previous valid avatar state until a new valid upload completes.

## 10. Validation Strategy
Validation is execution-only and must be agent-runnable.

- Run the app over HTTP for browser verification.
- Run code checks:
  - `lsp_diagnostics` clean enough for changed file(s), with no new errors;
  - syntax check on inlined script;
  - targeted grep/assertion to ensure no remaining business-path `basicInfo.url` usage.

### Milestone QA Scenarios

#### M1 - Harness and failing-check lock
```text
Scenario: Stable selectors exist for planned flows
  Tool: Playwright
  Steps: Open the app and query the agreed `data-testid` hooks for avatar input, avatar preview, basic info list, form status, and export button.
  Expected: All selectors exist before feature logic proceeds.
  Evidence: .sisyphus/evidence/avatar-m1-selectors.json

Scenario: Contract checks fail before implementation
  Tool: Playwright + JSON export inspection
  Steps: Export current data and inspect the payload + preview DOM.
  Expected: Pre-change baseline still exposes `basicInfo[].url` and/or anchor tags, proving the later contract checks are meaningful.
  Evidence: .sisyphus/evidence/avatar-m1-baseline-contract.json
```

#### M2 - Avatar local upload
```text
Scenario: Valid avatar upload persists through reload
  Tool: Playwright
  Steps: Upload `tests/fixtures/avatar-ok.png` -> verify `avatar-preview-image` updates -> reload page.
  Expected: The preview image changes after upload and remains changed after reload.
  Evidence: .sisyphus/evidence/avatar-m2-upload-reload.json

Scenario: Avatar framing persists through reload
  Tool: Playwright
  Steps: Upload `tests/fixtures/avatar-ok.png` -> change zoom and X/Y offset controls -> capture preview state -> reload page.
  Expected: The preview framing after reload matches the last saved zoom and offset values.
  Evidence: .sisyphus/evidence/avatar-m2-framing-reload.json

Scenario: Framing can move focus to the desired area
  Tool: Playwright
  Steps: Upload a portrait/full-body style fixture -> adjust zoom and vertical offset toward the head area -> inspect preview image style/state.
  Expected: The visible region changes deterministically according to the control values and can move focus upward within the avatar frame.
  Evidence: .sisyphus/evidence/avatar-m2-framing-focus.json

Scenario: Invalid and oversized avatar files are rejected safely
  Tool: Playwright
  Steps: Upload `tests/fixtures/not-image.txt`, then `tests/fixtures/avatar-oversize.jpg`.
  Expected: Exact error status appears, previous valid avatar remains, and no runtime error is thrown.
  Evidence: .sisyphus/evidence/avatar-m2-invalid-files.json

Scenario: Persistence failure does not fake success
  Tool: Playwright
  Steps: Stub `localStorage.setItem` to throw during avatar upload, then upload `tests/fixtures/avatar-ok.png`.
  Expected: Upload reports failure, avatar state rolls back to the previous persisted image, and reload shows no unpersisted change.
  Evidence: .sisyphus/evidence/avatar-m2-storage-failure.json
```

#### M3 - BasicInfo text-only contract
```text
Scenario: Form and export no longer expose `basicInfo.url`
  Tool: Playwright + JSON export inspection
  Steps: Open the form -> inspect basic-info cards -> export JSON.
  Expected: No link input exists in the form and exported `basicInfo` items contain no `url` field.
  Evidence: .sisyphus/evidence/avatar-m3-no-url-field.json

Scenario: Preview renders text only
  Tool: Playwright
  Steps: Fill email/phone/website-like values into basic-info items and inspect the preview DOM.
  Expected: Preview contains plain text rows with icons and zero anchor tags inside the basic-info section.
  Evidence: .sisyphus/evidence/avatar-m3-text-only-preview.json

Scenario: Existing icon/order behavior still works
  Tool: Playwright
  Steps: Change a basic-info icon, toggle custom icon mode, reorder items, and inspect preview order.
  Expected: Icon selection, custom icon rendering, and order updates still function after URL removal.
  Evidence: .sisyphus/evidence/avatar-m3-icon-order-regression.json
```

#### M4 - End-to-end regression
```text
Scenario: Export/import round-trip with new schema
  Tool: Playwright
  Steps: Upload valid avatar -> change framing controls -> edit basic info -> export JSON -> import the exported file into a clean session.
  Expected: Avatar, framing state, and basic-info values survive round-trip, and the payload follows the new schema.
  Evidence: .sisyphus/evidence/avatar-m4-roundtrip.json

Scenario: Print and pagination remain stable
  Tool: Playwright
  Steps: Load medium/long content -> trigger print path and inspect multi-page preview.
  Expected: Avatar/basic-info render correctly, print path does not throw, and pagination cues remain intact.
  Evidence: .sisyphus/evidence/avatar-m4-print-pagination.json
```

## 11. Acceptance Criteria
- User can upload a valid local avatar image and see it immediately in preview.
- Uploaded avatar persists across reload and JSON export/import.
- Avatar framing adjustments persist across reload and JSON export/import.
- Only `.png`, `.jpg`, `.jpeg`, and `.webp` files up to 2 MB are accepted.
- Oversized or invalid uploads are rejected with explicit status feedback and no runtime breakage.
- The app no longer exposes a `basicInfo` link input in the form.
- The app no longer renders clickable links inside the `basicInfo` preview.
- Exported/imported JSON follows the new schema and does not include `basicInfo[].url`.
- Existing `basicInfo` icon selection, custom icon mode, ordering, hide-empty behavior, and print/pagination remain functional.

## 12. Open Questions and Assumptions
### Confirmed
- Persist uploaded avatar to draft and JSON export/import.
- Do not support legacy URL-based schema compatibility.
- Render `basicInfo` as plain text only.
- Accept PNG/JPG/JPEG/WebP only.
- Enforce a 2 MB limit.
- Reject oversize files with explicit feedback rather than auto-compressing.
- Keep this as a new independent plan, not an amendment to `ats-ux-short-batch`.

### Working Assumptions
- `profileImage` remains a single string field storing a `data:image/*` payload after local upload.
- Avatar framing metadata is stored as serializable numeric values in the same draft/export model.
- The current fallback avatar remains available when no valid uploaded avatar exists.
- No freeform crop-box or rotation UI is needed for MVP; bounded zoom + X/Y controls are sufficient.

## 13. Approval Status
- Planning mode only.
- Draft plan written.
- Momus review: pending.
- Execution approval: not requested yet.
