# PBSTheme-Modern-Responsive

## AI Assistant Instructions

This document provides context for AI assistants (Claude, Codex, Gemini, etc.) working on this project.

### What This Project Is
A custom responsive CSS theme for the **Phi Beta Sigma Fraternity iMIS 20.2.66 member portal**. This is a CSS-only project - we cannot modify HTML or JavaScript, only CSS.

### Key Constraints
1. **CSS-only** - No access to HTML templates or JavaScript
2. **iMIS Platform** - Uses Telerik controls (RadMenu, RadTabStrip, RadGrid, RadComboBox)
3. **Must use `!important`** - To override iMIS base styles and UltraWave theme
4. **Master Page: Cities Responsive** - Provides viewport meta tag for mobile

### Live Sites
- **Production:** https://members.phibetasigma1914.org
- **Dev/Test:** https://members.phibetasigma1914.org/iMISdev/

---

## Brand Standards

| Element | Value |
|---------|-------|
| Primary Color (Royal Blue) | `#164F90` |
| Secondary Color | `#FFFFFF` |
| Accent Blue | `#6a9ac9` |
| Dark Blue | `#0d3a6a` |
| Font | Inter (Google Fonts) |

CSS Variables defined in `:root`:
```css
--pbs-blue: #164F90;
--pbs-blue-dark: #0d3a6a;
--pbs-blue-light: #2066ac;
--pbs-blue-accent: #6a9ac9;
--pbs-white: #FFFFFF;
```

---

## Project Structure

```
pbs-member-portal-theme/
├── package/                    # DEPLOY THIS FOLDER
│   ├── pbs-theme.css          # Main CSS file (edit this)
│   ├── ThemeSettings.xml      # iMIS theme manifest
│   └── images/
│       └── pbs-header2.png    # Header banner image
├── PBSTheme_Current_Production.css  # Reference/backup
├── testingScreenshots/        # Mobile/desktop screenshots for debugging
├── CLAUDE.md                  # This file (AI instructions)
└── README.md                  # User-facing documentation
```

### Key File: `package/pbs-theme.css`
This is the main CSS file. All edits should be made here. Structure:
1. Google Fonts import
2. CSS Variables
3. Base typography
4. Accessibility enhancements
5. YUI Grid layout (master page structure)
6. Bootstrap Grid (inner content)
7. Header & navigation
8. Sidebar & profile
9. Panels & content
10. Tabs
11. Buttons
12. Forms
13. Tables
14. **Responsive breakpoints** (991px, 767px, 480px)
15. Print styles

---

## CSS Architecture

### Layout Systems (Both Used Together)
1. **YUI Grid** - Outer page structure
   - `#doc`, `#hd`, `#bd`, `#ft` - Page sections
   - `#masterSideBarPanel` - Left sidebar
   - `#yui-main` - Main content area

2. **Bootstrap Grid** - Inner content
   - `.row`, `.col-sm-3`, `.col-sm-9`
   - Scoped to content areas to avoid breaking RadMenu

### Responsive Breakpoints
| Breakpoint | Behavior |
|------------|----------|
| Desktop (992px+) | 2-column layout, full nav |
| Tablet (768-991px) | Narrower sidebar |
| Mobile (< 767px) | Stacked columns, compact nav |
| Small mobile (< 480px) | Extra compact |

### iMIS/Telerik Selectors
```css
/* Navigation */
.RadMenu, .RadMenu_Austin, .rmLink, .rmRootLink, .rmItem

/* Tabs */
.RadTabStrip, .RadTabStripTop_Metro, .rtsLink, .rtsSelected

/* Grids */
.RadGrid, .rgMasterTable, .rgRow, .rgAltRow

/* Buttons */
.TextButton, .PrimaryButton, .aspNetDisabled

/* Panels */
.PanelHead, .PanelBody, .PanelField, .PanelFieldValue
```

---

## Common Tasks

### Adding Mobile Styles
Add rules inside the `@media (max-width: 767px)` block in `package/pbs-theme.css`.

### Removing Bullet Points from Lists
Target specific containers:
```css
#hd ul, #hd li,
.NavigationUnorderedList,
.NavigationListItem {
    list-style: none !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
}
```

### Styling Navigation Menu Items
```css
.RadMenu_Austin.RadMenu a.rmLink.rmRootLink {
    font-size: 10px !important;
    padding: 4px 6px !important;
    color: var(--pbs-white) !important;
    background-color: var(--pbs-blue) !important;
}
```

### Making Elements Full Width on Mobile
```css
@media (max-width: 767px) {
    #masterSideBarPanel,
    #yui-main {
        float: none;
        width: 100%;
    }
}
```

---

## Testing Workflow

1. Edit `package/pbs-theme.css`
2. Deploy to iMIS server (see deployment section)
3. Test on dev site: https://members.phibetasigma1914.org/iMISdev/
4. Take screenshots and save to `testingScreenshots/` for debugging
5. Commit changes to git

### Mobile Testing
- Use browser dev tools device emulation
- Test on actual iOS/Android devices
- Screenshots should be added to `testingScreenshots/` folder

---

## Deployment to iMIS

### Manual Deployment
1. Copy `package/` folder contents to iMIS server
2. Path: `C:\Program Files (x86)\ASI\iMIS\Net\App_Themes\PBSTheme-Modern-Responsive\`
3. In iMIS Staff: RiSE → Website → Theme Settings → Select theme

### Files to Deploy
- `pbs-theme.css`
- `ThemeSettings.xml`
- `images/pbs-header2.png`

---

## Session History (2026-01-30)

### Mobile Responsive Fixes
1. Switched from "Cities" to "Cities Responsive" master page (provides viewport meta)
2. Removed aggressive viewport overrides that were needed for non-responsive master
3. Fixed header links (Mark, Cart) showing bullet points
4. Made navigation buttons smaller and less clunky
5. Added space-maximizing CSS for mobile (reduced padding/margins)
6. Styled hamburger menu toggle
7. Fixed over-aggressive CSS that was hiding nav button text

### Current Mobile Styling
- Header links: Small outline buttons (11px, uppercase)
- Nav menu: Compact buttons (10px), blue background, horizontal flow
- Content: Reduced padding for more screen space
- Buttons: Full-width on mobile for easy tapping

---

## Known Issues / Limitations

1. **Login page header** - Different master page, requires iMIS admin config
2. **Bullet points** - May require inline style overrides in some cases
3. **JavaScript interactions** - Cannot be modified via CSS (hamburger toggle behavior)
4. **iMIS base styles** - Heavy use of `!important` required to override

---

## Git Workflow

```bash
# Check status
git status

# Stage and commit
git add package/pbs-theme.css
git commit -m "Description of changes"

# Push to GitHub
git push

# Pull latest
git pull
```

Repository: https://github.com/markc1914/pbs-member-portal-theme

---

## Tips for AI Assistants

1. **Always use `!important`** when overriding iMIS/Telerik styles
2. **Test mobile changes** in the 767px media query block
3. **Be careful with broad selectors** like `#hd *` - they can break things
4. **Check screenshots** in `testingScreenshots/` to understand current state
5. **The main CSS file is `package/pbs-theme.css`** - not the root level
6. **Commit frequently** - user deploys from git
