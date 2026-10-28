# Orientation-aware gallery ratios

## Intent

Keep the gallery orderly while respecting whether each photograph was composed horizontally or vertically.

## Requirements

- Landscape thumbnails use a 4:3 width-to-height ratio.
- Portrait and square thumbnails use a 3:4 width-to-height ratio.
- Orientation is detected from each image's intrinsic dimensions, including future CMS uploads.
- Thumbnail cropping remains centered and uses `object-fit: cover`.
- The lightbox continues to show the complete original with `object-fit: contain`.
- Desktop remains a three-column grid and mobile remains a one-column grid.

## Approach

Use the existing gallery JavaScript to classify each thumbnail after the image dimensions are available, then apply orientation-specific CSS classes. This avoids adding an orientation field to every work or asking the user to classify future uploads manually. A short layout adjustment may occur when a lazy-loaded landscape image is first revealed; keeping authoring automatic is preferred over maintaining duplicate metadata.

