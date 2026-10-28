# Orientation-aware Gallery Ratios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display landscape thumbnails at 4:3 and portrait or square thumbnails at 3:4 without changing lightbox behavior.

**Architecture:** Extend the existing gallery script to classify loaded images from `naturalWidth` and `naturalHeight`. CSS uses the resulting orientation classes to select the frame ratio while retaining centered cover cropping.

**Tech Stack:** Jekyll, vanilla JavaScript, CSS, Playwright

**Spec:** `docs/superpowers/specs/2026-10-28-orientation-gallery-ratios-design.md`

## Global Constraints

- Landscape means intrinsic width is greater than intrinsic height and uses 4:3.
- Portrait and square images use 3:4.
- Full-screen images remain uncropped with `object-fit: contain`.
- No new CMS fields or content metadata.

## Review Focus

- Cached images already complete when the script initializes must be classified immediately.
- Lazy images must be classified after their `load` event.
- Square images must receive the portrait/default 3:4 ratio.
- A broken image must not throw or block the rest of the gallery.
- Lightbox source and sizing must remain unchanged.

---

### Task 1: Classify thumbnail orientation and apply ratios

**Files:**
- Modify: `tests/gallery.spec.js`
- Modify: `assets/js/gallery.js`
- Modify: `assets/css/gallery.css`

**Interfaces:**
- Consumes: `.gallery-image` elements with intrinsic image dimensions.
- Produces: `.is-landscape` or `.is-portrait` on every successfully loaded gallery image.

- [ ] **Step 1: Write the failing browser test**

Add a test that reveals every thumbnail, compares intrinsic orientation with the applied class, and asserts a computed 4:3 or 3:4 frame ratio. Also assert the lightbox remains `object-fit: contain`.

- [ ] **Step 2: Run the test to verify it fails**

Run the orientation test against the current production site. Expected: FAIL because all thumbnails still use 4:5 and have no orientation class.

- [ ] **Step 3: Implement automatic orientation classification**

In `assets/js/gallery.js`, classify complete images immediately and attach a one-time `load` listener to incomplete images. In `assets/css/gallery.css`, use 3:4 as the default frame and 4:3 for `.is-landscape`.

- [ ] **Step 4: Verify locally and in the deploy preview**

Run the focused browser assertion at desktop and mobile widths, then run the complete CI suite. Expected: all loaded thumbnails match their intrinsic orientation, no horizontal overflow, and all tests pass.

- [ ] **Step 5: Commit**

```bash
git add assets/js/gallery.js assets/css/gallery.css tests/gallery.spec.js docs/superpowers
git commit -m "feat: size thumbnails by image orientation"
```
