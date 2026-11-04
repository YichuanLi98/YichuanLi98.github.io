# Painting Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish ten supplied ink landscape works in the Painting gallery using physically cropped website copies with square, portrait, and landscape display ratios.

**Architecture:** Keep each source file untouched and create a sanitized derivative in `assets/images/works`. Store an explicit `display_ratio` on every painting work, validate it in the content model, and let the shared gallery include and CSS apply Painting-only proportions while Photography retains its current rules.

**Tech Stack:** Jekyll/Liquid, YAML front matter, Decap CMS, vanilla JavaScript/CSS, Python/Ruby unit tests, Playwright, built-in image editing plus macOS `sips` for exact final canvas dimensions.

**Spec:** `docs/superpowers/specs/2026-11-05-painting-gallery-design.md`

## Global Constraints

- Keep the ten supplied source images untouched.
- Crop scanner margins without redrawing, retouching, recoloring, sharpening, or cleaning the artwork; if an exact-ratio crop would remove painted content, preserve it with neutral paper-color side padding.
- Titles are exactly `01` through `10`, in supplied order.
- Square works are `1:1`, portrait work `03` is `1:2`, and landscape works `05`–`08` are `2:1`.
- Photography keeps its current `3:4` and `4:3` behavior.
- The browser CMS must continue to edit all Painting work metadata and ordering.

## Review Focus

- Pale ink near a paper edge must not be mistaken for blank space; Task 1 requires side-by-side visual crop inspection before accepting each asset.
- Each cropped asset's pixel dimensions must match its declared ratio exactly; Task 1's content test parses the image dimensions and compares them with `display_ratio`.
- A missing or invalid Painting `display_ratio` must fail content validation; Task 1 adds positive and negative validator cases.
- Painting-specific proportions must not change Photography; Task 2's browser test checks both categories at desktop and mobile widths.
- A Painting opened in the CMS preview must use the same ratio class as the live gallery; Task 2 extends the preview smoke test to inspect the rendered preview tree.

---

### Task 1: Create Cropped Painting Assets and Validated Content

**Files:**
- Create: `assets/images/works/painting-01.jpg` through `assets/images/works/painting-10.jpg`
- Create: `_works/painting-01.md` through `_works/painting-10.md`
- Modify: `admin/config.yml:157-179`
- Modify: `scripts/validate_content.rb:7-75`
- Modify: `tests/test_content_model.py`
- Modify: `tests/test_cms_config.py`

**Interfaces:**
- Consumes: the ten supplied files under `/Users/liyichuan/Desktop/照片/selected/` in their supplied order.
- Produces: ten visible Painting works with `display_ratio` values `square`, `portrait`, or `landscape`, and ten metadata-clean image assets at exact corresponding ratios.

- [ ] **Step 1: Write failing content and CMS tests**

Add `ContentModelTest.test_painting_works_have_sequence_ratios_and_assets` asserting the exact title-to-ratio map:

```python
{
    "01": "square", "02": "square", "03": "portrait",
    "04": "square", "05": "landscape", "06": "landscape",
    "07": "landscape", "08": "landscape", "09": "square",
    "10": "square",
}
```

The test must also parse each JPEG's dimensions and assert `1:1`, `1:2`, or `2:1` exactly. Add validator cases that reject a Painting with missing or invalid `display_ratio`, and extend the CMS collection assertion so Painting alone exposes a required select field with values `square`, `portrait`, and `landscape`.

- [ ] **Step 2: Run targeted tests and verify they fail**

Run: `python3 -m unittest tests.test_content_model tests.test_cms_config -v`

Expected: FAIL because no Painting works or `display_ratio` field exists.

- [ ] **Step 3: Create and inspect the ten cropped derivatives**

Use the built-in image edit flow once per source image with the source as the edit target. Require an edit that removes blank scan margins, preserves every drawing mark and tonal value, and targets the ratio declared above. Save accepted outputs as `painting-01.jpg` through `painting-10.jpg`; use `sips` to normalize the final canvas to the exact ratio, adding neutral paper-color side padding where cropping alone would cut painted content. Inspect each derivative side-by-side with its source and reject any output that alters artwork or cuts meaningful content.

- [ ] **Step 4: Add work records, CMS field, and validation**

Create ten work files with titles `01`–`10`, category `painting`, the matching asset path, descriptive alt text, `display_ratio`, empty optional description/location, and `visible: true`. Add the Painting-only CMS select and make `validate_works` require one of `square`, `portrait`, or `landscape` for Painting while allowing Photography to omit it.

- [ ] **Step 5: Strip metadata from derivatives**

Run: `python3 scripts/sanitize_media.py --write assets/images/works/painting-*.jpg`

Expected: all ten files are sanitized without format errors.

- [ ] **Step 6: Run targeted tests and verify they pass**

Run: `python3 -m unittest tests.test_content_model tests.test_cms_config -v`

Expected: PASS, including exact asset ratios, unique paths, valid metadata, validator failures for bad ratios, and CMS field coverage.

- [ ] **Step 7: Commit**

```bash
git add assets/images/works/painting-*.jpg _works/painting-*.md admin/config.yml scripts/validate_content.rb tests/test_content_model.py tests/test_cms_config.py
git commit -m "feat: add cropped painting works"
```

### Task 2: Publish the Painting Collection with Category-specific Ratios

**Files:**
- Modify: `_data/site.yml:27-35`
- Modify: `_includes/gallery-item.html:1-18`
- Modify: `assets/css/gallery.css:244-318`
- Modify: `admin/preview.js:76-111`
- Modify: `tests/test_gallery.py`
- Modify: `tests/gallery.spec.js`

**Interfaces:**
- Consumes: Task 1's `display_ratio` values and exact-ratio image assets.
- Produces: live and CMS-preview Painting cards using `painting-square`, `painting-portrait`, or `painting-landscape` classes; Painting becomes a visible ordered gallery.

- [ ] **Step 1: Write failing rendered-gallery tests**

Update the Jekyll contract test to expect `coming_soon: false`, both `photography` and `painting` galleries, ten Painting items in title order `01`–`10`, non-empty alt text, and working lightbox sources. Add a Playwright test that checks at `1440×900` and `390×844`:

- Painting `01`, `02`, `04`, `09`, `10` render at `1:1`.
- Painting `03` renders at `1:2`.
- Painting `05`–`08` render at `2:1`.
- Photography still renders at `3:4` or `4:3` from intrinsic orientation.
- Every card height equals its image layout height and the page has no horizontal overflow.

Extend the CMS preview smoke test to render a Painting entry with `display_ratio: square` and assert the preview image receives `painting-square`.

- [ ] **Step 2: Run rendered-gallery tests and verify they fail**

Run: `python3 -m unittest tests.test_gallery tests.test_cms_config -v`

Run: `pnpm exec playwright test -g "painting gallery uses declared ratios"`

Expected: FAIL because Painting is still a holding screen and no Painting ratio classes exist.

- [ ] **Step 3: Publish Painting content and ratio classes**

Set the Painting heading to `Studies in ink and landscape.`, note to `Selected landscape studies from an ongoing drawing practice.`, `coming_soon: false`, and `work_order` to `painting-01` through `painting-10`. Have the shared include append `painting-<display_ratio>` only for Painting. Add Painting-scoped CSS for `1 / 1`, `1 / 2`, and `2 / 1` after the existing Photography orientation rules. Apply the same class mapping in `admin/preview.js`.

- [ ] **Step 4: Run rendered-gallery tests and verify they pass**

Run: `python3 -m unittest tests.test_gallery tests.test_cms_config -v`

Run: `pnpm exec playwright test -g "painting gallery uses declared ratios"`

Expected: PASS at desktop and mobile sizes with Photography unchanged.

- [ ] **Step 5: Run the full quality suite and inspect the preview**

Run: `ruby scripts/validate_content.rb --site _data/site.yml --works _works`

Run: `python3 -m unittest discover -s tests -v`

Run: `bundle exec jekyll build --strict_front_matter`

Run: `pnpm test:browser`

Expected: all commands pass. If the local macOS Ruby cannot run the locked Jekyll dependencies, use the repository's supported GitHub Actions Ruby environment as the required full-suite gate. Inspect desktop and mobile screenshots of the complete Painting section and open at least one work from each ratio class in the lightbox.

- [ ] **Step 6: Commit**

```bash
git add _data/site.yml _includes/gallery-item.html assets/css/gallery.css admin/preview.js tests/test_gallery.py tests/gallery.spec.js
git commit -m "feat: publish painting gallery"
```
