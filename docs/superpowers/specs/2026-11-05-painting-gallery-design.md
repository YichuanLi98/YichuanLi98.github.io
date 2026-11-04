# Painting Gallery Design

## Intent

Publish ten supplied ink landscape works in the existing Painting section so visitors can browse them alongside the photography archive. Preserve the drawings faithfully while removing scan margins that distract from the painted area.

## Goals

- Keep every supplied source image untouched outside the repository.
- Create a separate website copy for each work; crop scanner margins without redrawing, retouching, recoloring, sharpening, or cleaning the artwork.
- Turn off the Painting “Coming soon” state and render the works through the existing CMS-backed gallery and lightbox.
- Use the titles `01` through `10`, in the supplied order.
- Keep each work editable through the existing Painting collection in the browser CMS.

## Crop and Display Rules

Determine composition from the effective painted area after the large white scan margins are removed:

- Square `1:1`: works `01`, `02`, `04`, `09`, and `10`.
- Portrait `1:2`: work `03`.
- Landscape `2:1`: works `05`, `06`, `07`, and `08`.

The physical website copies will already have these ratios. Where an exact-ratio crop would remove painted content, retain the complete painted area and add neutral paper-color side padding instead of tightening the crop. Gallery thumbnails use the complete prepared copy rather than applying an additional destructive crop. The lightbox uses the same copy at `object-fit: contain`.

## Site Content and Layout

- Replace the holding screen with the existing Painting collection layout.
- Proposed heading: `Studies in ink and landscape.`
- Proposed note: `Selected landscape studies from an ongoing drawing practice.`
- Preserve the established three-column desktop and one-column mobile gallery rhythm.
- Apply the new `1:1`, `1:2`, and `2:1` rules only to Painting; Photography keeps its current orientation-aware `3:4` and `4:3` behavior.
- Write concise descriptive alt text for each drawing; do not invent locations, dates, dimensions, or media details.

## Approaches Considered

1. **Physical cropped copies — selected.** Produces stable, reusable assets and removes scan margins in both thumbnails and the lightbox. Costs extra files but keeps the originals safe.
2. **CSS-only crops.** Easier to revise and preserves one source file, but leaves the large scan margins visible in the lightbox and depends on per-image focal metadata.
3. **Automatic browser edge detection.** Avoids manual crop metadata but is unreliable for pale ink and paper tones and adds runtime complexity.

## Non-goals and Failure Conditions

- Do not modify or overwrite the ten supplied originals.
- Do not alter the drawing marks, tonal values, paper color, or composition; use paper-color padding when cropping alone cannot reach the agreed ratio without cutting painted content.
- Do not change the Photography gallery proportions or reorder existing photography works.
- Do not publish if a crop cuts through meaningful painted content or if any work is missing from the CMS, gallery, or lightbox.
