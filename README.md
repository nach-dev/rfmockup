# Raven Forge Games website mockup

Static website files prepared for GitHub Pages.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload **the contents of this folder** so `index.html` is at the repository's top level.
3. Commit the files to the `main` branch.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)`, then save.

GitHub will display the public website address after deployment finishes.

## Live event feed

The Events section reads `site/data/raven-forge-events.json` from
`nach-dev/tcg-event-scraper`. That feed is deliberately separate from the
scraper's national release/event data: it accepts only listings verified for
Raven Forge Games at 132 S. Steele St. in Sanford, NC.

The Raven Forge Lorcana, Magic, and Pokémon store pages are connected. One Piece
and Gundam remain visible as filters but show a safe empty state until a public,
store-specific official source is connected. The site will never substitute
national listings for local events.

## Important before launch

The listed events, store hours, external links, and newsletter form are currently mockup content. Confirm or replace them before using the site as Raven Forge Games' official website.
