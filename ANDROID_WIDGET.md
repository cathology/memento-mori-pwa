# Android Widget Implementation Guide

## Overview

True native Android home screen widgets cannot be created with PWA technology alone. This document outlines three approaches for bringing Memento Mori functionality to Android home screens, with increasing levels of native integration.

## Important Limitation

**PWAs cannot create native Android widgets.** The web technologies used (HTML, CSS, JavaScript) run in a browser context, not as native Android components. Home screen widgets require Java/Kotlin code and Android's Widget API.

## Option 1: PWA Shortcut (Pure Web Approach)

### Description
Add the PWA to the home screen as an app icon. When tapped, it opens the full PWA experience.

### Pros
- ✅ Works with current codebase, no additional development
- ✅ Offline functionality via service worker
- ✅ Install prompt via PWA manifest
- ✅ Cross-platform (works on iOS, Android, desktop)

### Cons
- ❌ Not a true widget (requires tap to open)
- ❌ No at-a-glance countdown on home screen
- ❌ No widget customization options

### Implementation
Already implemented! The `manifest.json` and service worker enable this.

**User instructions**:
1. Open the PWA in Chrome/Edge on Android
2. Tap menu (⋮) → "Add to Home screen" or "Install app"
3. Icon appears on home screen
4. Tap icon to launch full app

### Cost
- **Dev time**: 0 hours (already implemented)
- **Maintenance**: Minimal (part of existing PWA)

---

## Option 2: Capacitor Wrapper with Widget Plugin (Hybrid Approach)

### Description
Use [Capacitor](https://capacitorjs.com/) to wrap the PWA in a native Android app shell, then add a native widget component that communicates with the web view.

### Architecture
```
┌─────────────────────────────────┐
│     Native Android Widget       │
│  (Java/Kotlin + Android XML)    │
└────────────┬────────────────────┘
             │ IPC
             ↓
┌─────────────────────────────────┐
│      Capacitor Bridge           │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│      Web View (React PWA)       │
│   (Existing React/TypeScript)   │
└─────────────────────────────────┘
```

### Pros
- ✅ True home screen widget
- ✅ Reuses 95% of existing web code
- ✅ Can read localStorage data via Capacitor bridge
- ✅ Widget updates automatically

### Cons
- ❌ Android-only (no iOS widget support without separate Swift code)
- ❌ Requires Google Play Store distribution or APK sideloading
- ❌ Native development required for widget UI
- ❌ Bridge complexity for data synchronization
- ❌ App store review process

### Implementation Steps

1. **Setup Capacitor** (1-2 days)
```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/android
   npx cap init
   npx cap add android
   npm run build
   npx cap sync
```

2. **Create Native Widget** (3-5 days)
   - Create `MemoryWidget.kt` (Kotlin) or `MemoryWidget.java`
   - Define `widget_layout.xml` for UI
   - Implement `AppWidgetProvider` class
   - Add to `AndroidManifest.xml`

3. **Bridge Communication** (2-3 days)
   - Create Capacitor plugin for data sharing
   - Read birth date and lifespan from SharedPreferences
   - Calculate countdown in native code
   - Update widget via `AppWidgetManager`

4. **Testing & Distribution** (2-3 days)
   - Test on multiple Android versions (8.0+)
   - Handle widget resize events
   - Build release APK
   - Submit to Google Play Store (optional)

**Widget code example** (simplified):
```kotlin
class MementoMoriWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, widgetIds: IntArray) {
        for (widgetId in widgetIds) {
            val prefs = context.getSharedPreferences("memento", Context.MODE_PRIVATE)
            val birthDate = prefs.getLong("birth", 0)
            val lifespan = prefs.getInt("lifespan", 80)
            
            val remainingTime = calculateRemaining(birthDate, lifespan)
            
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setTextViewText(R.id.countdown, remainingTime)
            views.setInt(R.id.progressBar, "setProgress", calculatePercent())
            
            manager.updateAppWidget(widgetId, views)
        }
    }
}
```

### Cost
- **Dev time**: 8-13 days (1-2 weeks)
- **Ongoing maintenance**: Medium (Android updates, device compatibility)
- **Distribution**: Free (APK) or $25 one-time (Google Play)

---

## Option 3: Full Native App with WebView (Full Native)

### Description
Build a native Android app that uses a WebView for the main interface but implements the widget entirely in native code.

### Architecture
```
┌─────────────────────────────────┐
│   Native Android Widget         │
│   (Standalone, no WebView)      │
└────────────┬────────────────────┘
             │ Shared
             │ SQLite/SharedPrefs
             ↓
┌─────────────────────────────────┐
│   Native Android Activity       │
│   └─ WebView (loads React PWA)  │
└─────────────────────────────────┘
```

### Pros
- ✅ Optimal performance
- ✅ Complete control over widget behavior
- ✅ Native Android features (notifications, etc.)
- ✅ Widget works even if app never opened
- ✅ Can still use existing React code in WebView

### Cons
- ❌ Most complex implementation
- ❌ Duplicate logic (date calculations in Kotlin AND JavaScript)
- ❌ Requires strong Android development skills
- ❌ iOS version would need completely separate Swift implementation
- ❌ Significant ongoing maintenance burden

### Implementation Steps

1. **Create Android Project** (1 day)
   - Android Studio setup
   - Kotlin + Compose or XML layouts
   - Setup build.gradle dependencies

2. **Implement Widget** (5-7 days)
   - Widget layout XML
   - AppWidgetProvider implementation
   - AlarmManager for updates (every minute)
   - RemoteViews configuration
   - Widget configuration activity

3. **Implement Main Activity** (3-4 days)
   - WebView setup with JavaScript bridge
   - Load hosted PWA or bundle locally
   - Handle back button, permissions
   - Data synchronization layer

4. **Shared Data Layer** (2-3 days)
   - SQLite or SharedPreferences
   - Date calculation utilities
   - Widget update service
   - Background worker for periodic updates

5. **Polish & Testing** (3-5 days)
   - Multiple screen sizes
   - Dark mode
   - Android 8.0 - 14+ compatibility
   - Battery optimization handling
   - Widget resizing

**Widget configuration example**:
```xml
<!-- res/xml/widget_info.xml -->
<appwidget-provider
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="60000"
    android:initialLayout="@layout/widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
```

### Cost
- **Dev time**: 14-20 days (3-4 weeks)
- **Ongoing maintenance**: High (Android fragmentation, OS updates)
- **Distribution**: $25 one-time (Google Play)
- **iOS equivalent**: Additional 14-20 days for Swift/SwiftUI version

---

## Recommended Approach

### For Most Users: **Option 1** (PWA Shortcut)
- Zero additional development
- Works today
- Cross-platform

### For Serious Widget Functionality: **Option 2** (Capacitor)
- Best balance of effort vs functionality
- Reuses web codebase
- Achievable in 1-2 weeks

### For Maximum Control: **Option 3** (Full Native)
- Only if building a product for scale
- Requires dedicated Android developer
- Plan for 1 month+ development

## Widget Design Mockup

Regardless of implementation, a widget should include:
```
┌─────────────────────────────────────────┐
│  MEMENTO MORI                           │
│                                         │
│  28,547 : 18 : 34 : 12                 │
│  days    hrs  min   sec                │
│                                         │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░  42.7%           │
│                                         │
│  [Tap to open full app]                │
└─────────────────────────────────────────┘
```

**Widget sizes**:
- Small (2×2): Countdown only
- Medium (4×2): Countdown + percentage
- Large (4×4): Countdown + percentage + current quote

## Alternative: Web Widget (Experimental)

Some Android launchers (Nova Launcher, etc.) support **web widgets** that can display any webpage. This is a middle ground:

**Setup**:
1. Create a dedicated `/widget` route in the PWA
2. Simplified UI for small screens
3. Auto-refresh every 60 seconds
4. User adds as "web widget" in launcher

**Limitations**:
- Launcher-specific (not universal)
- Higher battery drain than native
- Less reliable updates
- No configuration UI

## Conclusion

True Android widgets require native development. The PWA provides an excellent mobile web experience, but users wanting widgets must either accept a shortcut (Option 1) or invest in hybrid/native development (Options 2-3).

**Recommendation**: Start with Option 1 (PWA shortcut), gauge user demand, then consider Option 2 (Capacitor) if widget functionality is frequently requested.
