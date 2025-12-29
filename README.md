# Memento Mori PWA

A minimalist Progressive Web App that reminds you of life's finite nature through an elegant countdown timer and life calendar visualization.

![Memento Mori Screenshot](https://via.placeholder.com/800x400/000000/ef4444?text=Memento+Mori)

## Features

- **Big Countdown Timer**: Real-time countdown showing days, hours, minutes, and seconds remaining
- **Classic Week Calendar**: Visual grid showing all weeks of your life (past weeks filled, future weeks outlined)
- **Catholic Memento Mori Quotes**: Rotating quotes every 10 seconds with customization options
- **PWA Support**: Install on your device, works offline after first load
- **Fully Customizable**: 
  - Toggle seconds display
  - Show/hide percentage and quotes
  - Choose accent colors (red, amber, green, blue, purple, pink)
  - Add custom quotes
  - Optional ticking sound
- **Share Feature**: Generate clean PNG images of your countdown
- **Privacy-First**: All data stored locally, never sent to servers
- **Accessible**: ARIA labels, keyboard navigation, high contrast support, reduced motion support

## Live Demo

🔗 **[View Live Demo](https://yourusername.github.io/memento-mori-pwa/)**

## Screenshots

### Countdown Mode
Large, readable timer with progress bar showing percentage of life lived.

### Calendar Mode
Week-by-week visualization of your entire life span.

## Installation

### Prerequisites
- Node.js 18+ and npm

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/memento-mori-pwa.git
cd memento-mori-pwa

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:5173
```

### Build for Production
```bash
npm run build

# Preview production build locally
npm run preview
```

## Deployment

This project is configured to automatically deploy to GitHub Pages via GitHub Actions.

### Setup GitHub Pages Deployment

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push to the `main` branch to trigger automatic deployment
5. Your site will be available at `https://yourusername.github.io/memento-mori-pwa/`

### Manual Deployment
```bash
npm run build
# Upload the contents of the `dist` folder to your hosting provider
```

## Usage

1. **First Time Setup**:
   - Enter your birth date
   - Select your expected lifespan (or use the external calculator link)
   - Click "Begin"

2. **Countdown Mode**:
   - View your remaining time in large, readable numbers
   - See the percentage of your life that has passed
   - Quotes rotate every 10 seconds at the bottom

3. **Calendar Mode**:
   - Click the calendar icon (bottom-right) to switch modes
   - Each circle represents one week of your life
   - Filled circles = weeks you've lived
   - Outlined circles = weeks remaining

4. **Customize**:
   - Click the hamburger menu (top-left)
   - Toggle quotes, percentage, seconds, and ticking sound
   - Choose your accent color
   - Manage which quotes to display
   - Add your own custom quotes

5. **Share**:
   - Click the share icon (top-right)
   - Downloads a clean PNG image
   - Uses Web Share API on supported devices

## Technology Stack

- **React** 18.2 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **date-fns** - Precise date calculations
- **html-to-image** - Screenshot generation
- **lucide-react** - Icons
- **vite-plugin-pwa** - Progressive Web App support
- **Workbox** - Service worker for offline functionality

## Project Structure
```
memento-mori-pwa/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/
│   ├── pwa-192x192.png  # PWA icon (192x192)
│   ├── pwa-512x512.png  # PWA icon (512x512)
│   └── favicon.ico      # Favicon
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── README.md            # This file
├── DESIGN.md            # UX and design decisions
└── ANDROID_WIDGET.md    # Android widget implementation guide
```

## Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Privacy & Security

- **Local Storage Only**: Your birth date and lifespan are stored in your browser's localStorage
- **No Analytics**: No tracking or analytics by default
- **No External Requests**: Operates entirely offline after initial load
- **No Account Required**: No sign-up, no passwords, no user accounts

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with PWA support

## Accessibility

- Keyboard navigable
- ARIA labels for screen readers
- High contrast mode support
- Respects `prefers-reduced-motion`
- Readable font sizes with responsive scaling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Catholic memento mori tradition for the default quotes
- [Wait But Why](https://waitbutwhy.com/2014/05/life-weeks.html) for the life calendar inspiration
- All contributors and users of this app

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the DESIGN.md and ANDROID_WIDGET.md files

---

**Remember**: *Memento Mori* - Remember that you must die. Use your time wisely.
