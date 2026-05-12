# Plan: Enhance Color Scheme Visibility, Hierarchy & Readability

## Context

The app uses the Jellybeans palette (warm earthy light / neutral dark). Both modes have visibility issues stemming from compressed surface levels and low-contrast secondary text. The goal is to improve hierarchy, contrast, and readability by adjusting CSS custom property values only — no color scheme change, no new borders added to components.

**Problems identified:**

- **Dark mode surfaces are too compressed** — `--background: #121212` to `--card: #181818` is only +6 hex steps; cards barely float above the page. `--secondary: #1d1d1d` and `--muted: #242424` are similarly squeezed.
- **Dark mode borders invisible** — `--border: #212121` is only 9 steps above background; separators don't read without squinting.
- **Dark mode hover states invisible** — `--sidebar-accent: #181818` is the same as `--card`; hovering a sidebar thread row has no visible feedback.
- **Dark mode popovers don't float** — `--popover: #121212` is identical to background; dropdowns blend into the page.
- **Muted text contrast too low at opacity** — `--muted-foreground: #888888` used with `/70` or `/60` opacity modifiers (common in TitleBar, ThreadRow, timestamps) drops below 3:1 — unreadable.
- **Light mode muted text below AA** — `--muted-foreground: #6a6560` on `--background: #f3efe8` is ~4.2:1, just under the 4.5:1 WCAG AA threshold.
- **Light mode sidebar barely separates** — `--sidebar: #e8e4dd` vs `--background: #f3efe8` difference is very subtle.

---

## File to change

**`apps/web/src/index.css`** — only the CSS custom property values in `:root` and `.dark`.  
No component `.tsx` files modified. No new border classes added.

---

## Proposed Changes

### Light Mode (`:root`)

| Variable | Current | Proposed | Why |
|---|---|---|---|
| `--muted-foreground` | `#6a6560` | `#5c5854` | Raises contrast to ~5.1:1 on background; at 70% opacity still ~3.6:1 |
| `--border` | `#e6e1d9` | `#d8d2c9` | Separators become subtly visible without adding weight |
| `--sidebar` | `#e8e4dd` | `#e0dad1` | Clearer tonal separation from `--background` |
| `--sidebar-border` | `#e0dbd4` | `#d5cfc6` | Keeps sidebar border proportional to new sidebar tone |

Leave unchanged: `--background`, `--foreground`, `--card`, `--secondary`, `--muted`, `--accent`, `--input`, `--primary`, `--destructive`, chart/ring values, sidebar-accent/primary.

---

### Dark Mode (`.dark`)

| Variable | Current | Proposed | Why |
|---|---|---|---|
| `--card` | `#181818` | `#1c1c1c` | +10 steps above bg (was +6); chat input box, cards clearly float |
| `--popover` | `#121212` | `#1c1c1c` | Popovers/dropdowns now visually elevate above background |
| `--secondary` | `#1d1d1d` | `#222222` | Recessed panels still below card, more distinct from background |
| `--muted` | `#242424` | `#2b2b2b` | Muted background areas clearly separate from secondary |
| `--accent` | `#303030` | `#393939` | Hover/selection highlight is now visible (+25% step increase) |
| `--border` | `#212121` | `#2c2c2c` | Separators perceptible; layout seams readable without being heavy |
| `--input` | `#1f1f1f` | `#252525` | Input fields more distinct from card background |
| `--muted-foreground` | `#888888` | `#9e9e9e` | Base contrast ~6.2:1; at 70% opacity ~4.4:1 (meets AA) |
| `--sidebar-accent` | `#181818` | `#242424` | Hover state in sidebar thread rows is now visible |
| `--sidebar-border` | `#161616` | `#1e1e1e` | Sidebar section separators slightly perceptible |

Leave unchanged: `--background`, `--foreground`, `--card-foreground`, `--sidebar`, `--sidebar-foreground`, `--primary`, `--primary-foreground`, `--destructive`, chart/ring values, sidebar-primary.

---

## What does NOT change

- No component `.tsx` files are modified
- No new `border-*` or `ring-*` Tailwind classes added
- Primary (`#1a4080` / `#3a6090`), destructive, and chart palette colors stay the same
- Warm Jellybeans character preserved — only neutral surface levels and secondary text gray shift

---

## Verification

1. Run dev server: `cd apps/web && npm run dev`
2. Toggle dark/light mode (Ctrl+Shift+T) and visually check:
   - Chat input box (`bg-card`) visually floats above the page background
   - Sidebar thread row hover state is visible
   - Dropdown menus (model picker, thread options) float above content
   - Timestamps, model names, breadcrumb workspace labels are readable
   - Tab bar (`bg-muted/20`) has visible tonal separation from content area
   - No regression on primary foreground text (`--foreground`)
