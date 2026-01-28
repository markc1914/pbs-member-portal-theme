# Phi Beta Sigma Member Portal - CSS Theme Project

## Project Overview
Custom responsive CSS theme for the Phi Beta Sigma Fraternity iMIS 20.2.66 member portal.

**Live Site:** https://members.phibetasigma1914.org
**Dev Site:** https://members.phibetasigma1914.org/iMISdev/

## Brand Standards
- **Primary Color (Royal Blue):** #164F90
- **Secondary Color (White):** #FFFFFF
- **Accent Blue:** #6a9ac9
- **Font:** Inter (Google Fonts)

## Files
- `pbs-theme.css` - Main responsive theme file
- `PBSTheme_Current_Production.css` - Reference copy of production CSS
- `AccountPage.html` - Sample account page HTML
- `AccountPageInDev.html` - Dev site HTML for testing

## Key CSS Features Implemented

### 1. Layout System
- **YUI Grid** - For outer page structure (`#masterSideBarPanel`, `#yui-main`)
- **Bootstrap Grid** - For inner content (`.row`, `.col-sm-3`, `.col-sm-9`)
- Both grids work together with `!important` flags to override iMIS defaults
- Responsive breakpoints: 576px, 767px, 991px, 480px

### 2. Navigation (RadMenu)
- Blue navigation bar with white text
- Uppercase menu items with letter-spacing
- Dropdown menus with proper styling
- Border accents (#6a9ac9)

### 3. Buttons
- **Enabled buttons:** Blue (#164F90)
- **Disabled buttons (.aspNetDisabled):** Grey (#6c757d)
- Applies to Renew Now, Pay Other Items, etc.
- Checkout button always blue

### 4. Icons (SVG inline)
- **Gear icon:** Panel settings/configure
- **Pencil icon:** Edit controls
- **Trash icon (red):** Delete controls
- **Plus icon:** Add controls
- CSS tooltips on hover

### 5. Tables
- Horizontal scroll for wide tables (Education Background, etc.)
- `overflow-x: auto` on `.PanelBody`, `.ContentWizardDisplay`
- Blue header rows
- Min-width prevents over-compression

### 6. Forms
- Focus states with blue outline
- Rounded corners (3px)
- Box shadows on inputs

### 7. Profile Section (Left Sidebar)
- Profile image with blue border, fixed width (130px desktop, 100px mobile)
- Natural aspect ratio preserved (no distortion)
- Sidebar content fills full column width
- 2-column layout (25% sidebar, 75% content)

### 8. Tabs (RadTabStrip)
- Metro style with blue background
- White text, white border on selected

## iMIS-Specific Notes
- Uses Telerik controls (RadMenu, RadTabStrip, RadGrid, RadComboBox)
- ASP.NET disabled buttons use `.aspNetDisabled` class
- Session timeout dialog may appear incorrectly (JavaScript issue, not CSS)
- Theme imports UltraWave base styles

## CSS Load Order (in iMIS)
1. `01-MasterPage.css`
2. `pbs-responsive-theme.css` (this theme)
3. `PBSTheme.css`

## Responsive Behavior
- **Desktop (992px+):** 2-column layout, full navigation
- **Tablet (768-991px):** Narrower sidebar
- **Mobile (< 767px):** Stacked columns, smaller nav text
- **Small mobile (< 480px):** Compact navigation

## Session History (2026-01-27)
1. Started with brand color extraction from screenshots
2. Created initial comprehensive theme
3. Simplified to avoid layout conflicts
4. Added Bootstrap grid support (missing from dev site)
5. Added YUI grid support for master page structure
6. Fixed `#yui-main` to allow Bootstrap grid inside
7. Added conditional button styling (grey/blue based on disabled state)
8. Added SVG icons with CSS tooltips
9. Added horizontal scroll for wide tables

## Session History (2026-01-28)
1. Fixed left sidebar content to fill full column width
   - Added width rules for `.col-sm-3` child elements
   - Targeted iMIS-specific containers (`[id*="ste_container"]`, etc.)
2. Fixed Renewal button box blue background
   - Made `.UsePrimaryButton` and `.UseLargeButton` containers transparent
   - Used aggressive `*` selector to override UltraWave base styles
3. Fixed profile image distortion
   - Removed forced square dimensions that caused oval/stretched images
   - Set fixed width (130px) with `height: auto` to preserve aspect ratio
   - Mobile breakpoint uses 100px width
4. Created dedicated git repository for project

## Current Status
- Theme is functional and responsive
- Profile image displays correctly at all screen sizes
- Renewal box has transparent background (matches other sidebar boxes)
- Left sidebar content fills full width

## Next Steps / Known Issues
- Fine-tune profile image sizing if needed
- Test on actual iMIS dev site with CSS deployed
- May need additional tweaks for specific iMIS pages/components
