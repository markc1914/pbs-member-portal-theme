# PBS Member Portal Theme - Issue Tracker

This document tracks known issues and their status for the PBS Member Portal CSS theme.

---

## Open Issues

### Issue #7: Banner image not showing on login page
- **Status:** Open
- **Priority:** High
- **Page:** Login page
- **Description:** The PBS header banner image is not visible on the login page. A gray bar appears where the banner should be, with the nav menu covering the area.
- **Expected:** Banner image should display above the navigation menu
- **Screenshot:** `~/Screenshots/Screenshot_2026-01-31_at_7_30_09 PM.png`

---

### Issue #8: Nav dropdown z-index (menus appearing behind content)
- **Status:** Open
- **Priority:** High
- **Page:** Education Material page (and potentially others)
- **Description:** Navigation dropdown submenus appear behind page content instead of on top. The REGIONS dropdown menu items are visible but appear behind the document library content.
- **Expected:** Dropdown menus should always appear on top of page content
- **Screenshot:** `~/Screenshots/Screenshot_2026-01-31_at_7_31_55 PM.png`
- **Fix:** Increase z-index on `.rmGroup`, `.rmSlide`, and related dropdown elements

---

### Issue #9: Community page sidebar/logo styling
- **Status:** Open
- **Priority:** Medium
- **Page:** Community page
- **Description:** The PBS Fraternity logo/seal area in the community sidebar may have styling issues. Needs review for proper sizing and layout.
- **Screenshot:** `~/Screenshots/Screenshot_2026-01-31_at_7_32_03 PM.png`

---

## Resolved Issues

### Issue #1: Nav menu covering banner image
- **Status:** Resolved (2026-01-31)
- **Fix:** Added margin-bottom to `#masterHeaderBackground` and increased header height

### Issue #2: Header button overlap (SIGN OUT, MARK, CART)
- **Status:** Resolved (2026-01-31)
- **Fix:** Removed fixed positioning from Sign Out button, adjusted button spacing

### Issue #3: Empty blue oval on login page
- **Status:** Resolved (2026-01-31)
- **Fix:** Removed SignIn from button styling selectors to prevent display conflict with hiding rules

### Issue #4: Nav text too small for accessibility (50+ users)
- **Status:** Resolved (2026-01-31)
- **Fix:** Increased nav font from 8px to 11px on desktop and mobile

### Issue #5: Mobile nav menu styling
- **Status:** Resolved (2026-01-31)
- **Fix:** Increased mobile nav font to 11px, adjusted padding for touch targets

### Issue #6: Mobile viewport testing
- **Status:** Resolved (2026-01-31)
- **Fix:** Updated test script to support `--all` flag for comprehensive viewport testing

---

## Testing

Run automated tests to verify fixes:

```bash
# Desktop only
node test-css.js "username" "password"

# All viewports (desktop, tablet, mobile)
node test-css.js "username" "password" --all
```

Screenshots are saved to `automatedTestScreenshots/` folder.

---

## How to Report Issues

1. Take a screenshot of the issue
2. Annotate with red circles to highlight problem areas
3. Save to `~/Screenshots/` folder
4. Add issue details to this file with:
   - Status
   - Priority (High/Medium/Low)
   - Affected page(s)
   - Description
   - Expected behavior
   - Screenshot path

---

*Last updated: 2026-01-31*
