# Phi Beta Sigma Member Portal Responsive Theme

Responsive CSS theme for the iMIS 20.2.66 member portal for Phi Beta Sigma Fraternity, Inc.

## Quick Links

- **[Issue Tracker](ISSUES.md)** - Current bugs and their status
- **[Developer Guide](CLAUDE.md)** - Technical documentation for AI assistants and developers

## Live Sites

| Environment | URL |
|-------------|-----|
| Production | https://members.phibetasigma1914.org |
| Development | https://members.phibetasigma1914.org/iMISdev/ |

## Project Structure

```
pbs-member-portal-theme/
├── package/                    # DEPLOY THIS FOLDER
│   ├── pbs-theme.css          # Main CSS file
│   ├── ThemeSettings.xml      # iMIS theme manifest
│   └── images/
│       └── pbs-header2.png    # Header banner image
├── test-css.js                # Automated Puppeteer testing
├── automatedTestScreenshots/  # Test output (gitignored)
├── ISSUES.md                  # Issue tracker
├── CLAUDE.md                  # Developer documentation
└── README.md                  # This file
```

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Royal Blue | `#164F90` | Primary brand color |
| Dark Blue | `#0d3a6a` | Hover states, accents |
| Accent Blue | `#6a9ac9` | Links, highlights |
| White | `#FFFFFF` | Backgrounds, text |

## Automated Testing

Run visual regression tests with Puppeteer:

```bash
# Install dependencies (first time only)
npm install puppeteer

# Run desktop tests
node test-css.js "username" "password"

# Run all viewport tests (desktop, tablet, mobile)
node test-css.js "username" "password" --all
```

Screenshots are saved to `automatedTestScreenshots/` folder.

## Deployment

1. Edit `package/pbs-theme.css`
2. Copy `package/` folder contents to iMIS server:
   ```
   C:\Program Files (x86)\ASI\iMIS\Net\App_Themes\PBS_Responsive_Theme\
   ```
3. Test on dev site before production

## Current Status

See **[ISSUES.md](ISSUES.md)** for:
- Open issues with screenshots
- Resolved issues and their fixes
- Testing instructions

## Repository

https://github.com/markc1914/pbs-member-portal-theme
