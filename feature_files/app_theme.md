# App Theme

## Summary
The shared Next.js stylesheet defines Medley's site-wide visual palette and component colors. The app uses a dark background with light text and teal accents across authentication, playlist browsing, and song collection screens.

## Key Points
- **Dark palette**: Shared CSS variables in `src/app/globals.css` define page surfaces, foreground text, muted text, borders, and accents.
- **Component surfaces**: Notices, forms, and collection panels use translucent light overlays that remain subdued against the dark background.
- **Readable controls**: Inputs and buttons use high-contrast text, with teal focus outlines and link accents.
- **Configuration**: `parameter_files/app_theme.toml` is reserved; no tunable theme values are currently read from it.

## Relevant Files
- `src/app/globals.css`: Global palette, page background, and shared component styling.
- `src/app/layout.tsx`: Loads the global stylesheet for the app.
- `parameter_files/app_theme.toml`: Reserved feature parameter file.

## Dev Mode
HACKING

## State Log
- 2026-11-04: Switched the shared app palette from light surfaces to a dark background with light text and teal accents.
