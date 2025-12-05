# Hamcat - Portfolio & Music Tools

## Overview
This is a portfolio website for Hamcat, an electronic music producer, DJ, and music tool creator. The site features:
- Portfolio pages for tracks and DJ mixes
- Music production tools (pitch/tempo calculator, BPM converter, sample manager)
- Information about the artist's work in psytrance, tekno, folk, and punk genres

## Project Type
Static website with pure HTML, CSS, and JavaScript (no build process required)

## Project Structure
```
public/
  ├── index.html          # Homepage
  ├── r.html              # Redirect handler (uses config.json)
  ├── assets/
  │   ├── style.css       # Main stylesheet
  │   └── nav.js          # Navigation functionality
  ├── portfolio/
  │   ├── tracks.html     # Music tracks portfolio
  │   └── mixes.html      # DJ mixes portfolio
  └── tools/
      ├── pitch.html      # Pitch/tempo calculator
      ├── bpm.html        # BPM converter
      └── samples.html    # Sample manager
```

## Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Server**: Node.js HTTP server (serves static files)
- **Hosting**: Configured for Replit deployment

## Development Setup
- Server runs on port 5000 (bound to 0.0.0.0 for Replit compatibility)
- Cache headers disabled for development
- Mobile-responsive navigation
- URL rewrites for /r endpoint (redirect service)

## Key Features
1. **Portfolio**: Showcase of music production and DJ work
2. **Music Tools**: Interactive calculators for harmonic mixing and tempo adjustment
3. **Redirect Service**: QR code-friendly redirect system using config.json
4. **Mobile Navigation**: Responsive hamburger menu

## Recent Changes
- 2025-12-05: Initial Replit setup
  - Created Node.js static file server
  - Configured workflow to run on port 5000
  - Set up cache control headers for proper development experience
  - Configured deployment settings

## Deployment
Configured as a static website deployment serving files from the public directory.
