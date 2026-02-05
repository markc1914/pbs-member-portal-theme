# PBS Member Portal Theme - Issue Tracker

This document tracks known issues and their status for the PBS Member Portal CSS theme.

---

## Open Issues

*No open issues at this time.*

---

## Resolved Issues

### Chrome login redirect loop due to cookie path mismatch
- **Status:** Resolved (2026-02-05)
- **Fix:** Updated web.config on both DEV and Production: added `path="/"` and `cookieSameSite="None"` to `<forms>`, added `sameSite="None"` to `<httpCookies>`, and `cookieSameSite="None"` to `<sessionState>`. This prevents duplicate cookies at different paths that caused Chrome to send the wrong cookie first.

### Stale CSS/static content after deployments
- **Status:** Resolved (2026-02-05)
- **Fix:** Added `Cache-Control: no-cache` header in web.config `<httpProtocol><customHeaders>` section. Browsers still cache static files but always revalidate with server. After deployments, users get fresh content immediately; unchanged files return 304 Not Modified for fast loads.

### Issue #36: Panel editor dialog not opening to correct size
- **Status:** Resolved (2026-02-02)
- **Fix:** Removed overly broad table width rules from RadWindow dialogs. Added targeted width rules for dialog layout tables and iframe min-width for community dialogs. Disabled "hide empty panel" rule that was hiding dynamic content. Verified working in Chrome and Safari via Playwright cross-browser testing.

### Issue #15: Redundant SIGN IN button on login page
- **Status:** Resolved (2026-02-02)
- **Fix:** Added CSS to hide the SIGN IN button specifically on the login page using body class selector while keeping SIGN OUT visible on authenticated pages.

### Issue #16: Community page sidebar appears at bottom instead of right side
- **Status:** Resolved (2026-02-02)
- **Fix:** Added flexbox layout to `.body-container` with `flex-direction: row`. Sidebar (`#ctl01_SubNavPanel`) now has fixed 280px width, positioned as order: 2 (right side). Main content takes remaining space. Mobile stacks sidebar below content. Header/footer explicitly excluded from flex layout.

### Issue #14: Resource library folders don't collapse when minus clicked
- **Status:** Resolved (2026-02-02)
- **Fix:** Removed `!important` from `.rtUL` display rules and added attribute selector `[style*="display: none"]` to respect JavaScript's inline styles when collapsing folders.

### Issue #13: Banner image "Membership Database" text cut off at 1440p
- **Status:** Resolved (2026-02-02)
- **Fix:** Changed `background-size` from `cover` to `contain` in HEADER IMAGE PROTECTION section. Blue background fills gaps on ultra-wide monitors while showing full banner text.

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

*Last updated: 2026-02-05 (Resolved stale content caching issue)*
