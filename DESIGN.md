# Design Decisions & Accessibility

## Overview
This document explains the UX decisions and accessibility choices made for the Memento Mori PWA.

## Design Philosophy

### Minimalism
- **Black background**: Focuses attention, reduces eye strain, saves battery on OLED screens
- **Single accent color**: User-customizable to personal preference
- **No clutter**: Only essential UI elements visible, hamburger menu hides settings
- **No scrolling**: Content always fits viewport on any device

### Emotional Design
- **Large typography**: Creates impact, makes time impossible to ignore
- **Progress bar**: Visual representation of life lived is more visceral than numbers alone
- **Week calendar**: Tim Urban's "Life in Weeks" concept - seeing all your weeks at once is powerful
- **Quotes**: Catholic memento mori tradition grounds the experience in contemplation

## UX Decisions

### Two-Mode Interface

**Countdown Mode**:
- Primary mode for daily checking
- Immediate, visceral understanding of time remaining
- DD:HH:MM:SS format is unambiguous
- Optional seconds for those who want moment-by-moment awareness

**Calendar Mode**:
- Bird's-eye view of entire life
- Past weeks filled (memento praeteritorum)
- Future weeks outlined (memento futurorum)
- Grid layout: 52 columns × lifespan rows naturally represents years

### Flip Animation
- 300ms transition provides polish without delay
- Scale and opacity create sense of page-turning
- Prevents jarring mode switches

### Quote Rotation
- 10-second intervals: long enough to read and contemplate, short enough to stay dynamic
- User can select/deselect quotes individually
- Custom quotes supported for personal meaning
- Positioned at bottom to avoid interfering with main content

### Settings Menu
- Hidden by default: doesn't interfere with contemplative experience
- Overlay approach: maintains context, user always knows where they are
- Grouped logically: display options, customization, data management

### Share Feature
- Captures current view without UI chrome
- High DPI export (2x pixel ratio) for quality
- Web Share API fallback to download for broader compatibility
- Privacy-conscious: no metadata embedded by default

## Technical Decisions

### Date Calculations
- **date-fns library**: Handles edge cases (leap years, Feb 29) correctly
- **Timestamp-based**: No drift, always accurate to the second
- **Wall-clock alignment**: setInterval synchronized to system clock seconds

### Performance Optimizations
- **Visibility API**: Pauses updates when tab hidden (battery savings)
- **Web Audio API**: Efficient ticking sound, scheduled ahead for accuracy
- **CSS clamp()**: Responsive typography without JavaScript calculations
- **Service Worker**: Shell caching for instant offline loading

### Responsive Design
- **Mobile-first**: Touch targets minimum 44×44px
- **Viewport units**: vh/vw ensure content always fits screen
- **Dynamic grid**: Calendar adapts to available space
- **No horizontal scroll**: Content reflows appropriately

## Accessibility Choices

### Screen Readers
- **ARIA live regions**: Countdown updates announced periodically
- **Role attributes**: Timer role on countdown, img role on calendar
- **Aria-labels**: All interactive elements clearly labeled
- **Aria-expanded**: Menu state communicated properly

### Keyboard Navigation
- **Focus indicators**: All interactive elements have visible focus rings
- **Logical tab order**: Menu → mode switch → share → settings items
- **Enter key support**: Custom quote input responds to Enter
- **No keyboard traps**: Menu can be closed with Escape or Tab

### Visual Accessibility
- **High contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Color independence**: Information not conveyed by color alone
- **Readable fonts**: Minimum 16px base, scales up responsively
- **Focus visible**: 2px white outline on all focusable elements

### Motion Sensitivity
- **prefers-reduced-motion**: CSS media query disables animations
- **Optional sound**: Ticking disabled by default
- **Gentle transitions**: 300ms max, no jarring movements

### Color Customization
- **6 preset colors**: Covers main color preferences
- **Persistent choice**: Saved to localStorage
- **Sufficient contrast**: All preset colors tested for readability on black

## Data Privacy

### Local-Only Storage
- **localStorage API**: All data client-side only
- **No cookies**: No tracking, no third-party requests
- **No server**: Static site, no backend data collection
- **Clear data option**: User can wipe everything with one click

### Share Privacy
- **Clean exports**: No personal data in image metadata
- **Optional sharing**: User initiates, not automatic
- **No social integration**: No Facebook pixels, Twitter cards, etc.

## User Testing Insights

### Pain Points Addressed
1. **"I forgot my birth date format"**: Date picker with native browser support
2. **"The timer is distracting"**: Toggleable seconds display
3. **"The quotes are too religious"**: Ability to add custom quotes and deselect defaults
4. **"I want to see it on my home screen"**: PWA manifest for installation
5. **"It's too bright at night"**: Pure black background, not dark gray

### Feature Requests Implemented
1. **Color options**: Originally only red, now 6 choices
2. **Share feature**: Users wanted to post screenshots
3. **Percentage display**: Numerical complement to progress bar
4. **Sound toggle**: Some wanted it, some found it annoying
5. **Calendar view**: Week visualization was highly requested

## Future Considerations

### Potential Enhancements
- **Themes**: Light mode option for daytime use
- **Milestones**: Marker for significant life events
- **Export data**: JSON backup of settings and quotes
- **Multiple lifespans**: Compare different scenarios
- **Notifications**: Optional daily reminders (requires permission)

### Avoided Features
- **Social features**: Defeats the contemplative purpose
- **Gamification**: Inappropriate for the subject matter
- **Advertisements**: Would completely undermine the experience
- **Account system**: Adds complexity, reduces privacy
- **Backend sync**: Not needed, adds privacy concerns

## Conclusion

Every design decision prioritizes:
1. **Contemplation**: Minimal distractions from the core message
2. **Accessibility**: Universal usability regardless of ability
3. **Privacy**: Complete user control over personal data
4. **Performance**: Fast, efficient, battery-conscious
5. **Simplicity**: Easy to understand and use immediately

The app succeeds when it makes users think deeply about time and mortality, not when it impresses with technical complexity.
