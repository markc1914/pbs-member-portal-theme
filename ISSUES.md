# PBS Member Portal Theme - Issue Tracker

This document tracks known issues and their status for the PBS Member Portal CSS theme.

---

## Open Issues

### Issue #13: Banner image "Membership Database" text cut off at 1440p
- **Status:** Open
- **Priority:** Medium
- **Affected page(s):** All pages with banner (authenticated)
- **Description:** On wide monitors (1440p/2560x1440), the banner image text "Membership Database" is cut off on the right side
- **Expected behavior:** Full banner text should be visible at all reasonable desktop resolutions
- **Viewport:** 2560x1440 (1440p)
- **Screenshot:** `automatedTestScreenshots/1440p-header-closeup-1769990129291.png`
- **Details:** Text "MEMBERSHIP DATABASE" shows as "MEMBERSHIP DATABA" - the "SE" is clipped

---

## Resolved Issues

### Issue #12: Nav bar grey area on right side
- **Status:** Resolved (2026-01-31)
- **Fix:** Added header-bottom-container blue background to match nav bar

### Issue #11: Sign Out button invisible
- **Status:** Resolved (2026-01-31)
- **Fix:** Sign Out button (ctl01_LoginStatus1) was hidden by CSS. Used specific selectors to override hidden state and positioned fixed in top right with MARK and CART buttons

### Issue #10: Banner image not showing founders (3 men silhouette)
- **Status:** Resolved (2026-01-31)
- **Fix:** Banner image is 1040x89px. Increased width to 1040px (max-width 95%) to show full image including founders on right side. Mobile scales full image to fit viewport width.

### Issue #9: Community page sidebar/logo styling
- **Status:** Resolved (2026-01-31)
- **Fix:** Constrained community logo max-width to 200px, added border-radius, ensured sidebar container doesn't overflow

### Issue #8: Nav dropdown z-index (menus appearing behind content)
- **Status:** Resolved (2026-01-31)
- **Fix:** Increased rmSlide and rmGroup z-index from 10000 to 99999, ensures dropdowns appear above all page content

### Issue #7: Banner image not showing on login page
- **Status:** Resolved (2026-01-31)
- **Fix:** Added !important to header image rules, ensured #masterHeaderBackground has proper height (130px), added z-index to header image element

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
# Standard testing (desktop)
node test-css.js "username" "password"

# All viewports (desktop, tablet, mobile)
node test-css.js "username" "password" --all

# CSS override testing (tests CSS changes without deployment)
node test-css-override.js "username" "password"
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
