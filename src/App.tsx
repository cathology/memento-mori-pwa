// App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addYears, differenceInDays } from 'date-fns';
import { toPng } from 'html-to-image';

const DEFAULT_QUOTES = [
  "Remember, man, that thou art dust, and to dust thou shalt return.",
  "In the midst of life we are in death.",
  "Teach us to number our days, that we may gain a heart of wisdom. - Psalm 90:12",
  "For what shall it profit a man, if he shall gain the whole world, and lose his own soul? - Mark 8:36",
  "Watch ye therefore: for ye know not when the master of the house cometh. - Mark 13:35",
  "The fear of the Lord is the beginning of wisdom. - Proverbs 9:10",
  "Memento Mori - Remember that you must die.",
];

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const App: React.FC = () => {
  const [birthDate, setBirthDate] = useState('');
  const [lifespan, setLifespan] = useState(80);
  const [isSetup, setIsSetup] = useState(false);
  const [mode, setMode] = useState<'countdown' | 'calendar'>('countdown');
  const [flipping, setFlipping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [percent, setPercent] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotes, setQuotes] = useState(DEFAULT_QUOTES);
  const [selectedQuotes, setSelectedQuotes] = useState(new Set(quotes.map((_, i) => i)));
  const [showQuotes, setShowQuotes] = useState(true);
  const [showPercent, setShowPercent] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [tickSound, setTickSound] = useState(false);
  const [accentColor, setAccentColor] = useState('#ef4444');
  const [capturing, setCapturing] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [calendarCols, setCalendarCols] = useState(52);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickEnabledRef = useRef<boolean>(false);

  /** Load settings on mount */
  useEffect(() => {
    const saved = localStorage.getItem('memento.birth');
    const savedLifespan = localStorage.getItem('memento.lifespan');
    const savedQuotes = localStorage.getItem('memento.quotes');
    const savedSelected = localStorage.getItem('memento.selectedQuotes');
    const savedAccent = localStorage.getItem('memento.accentColor');
    const savedShowQuotes = localStorage.getItem('memento.showQuotes');
    const savedShowPercent = localStorage.getItem('memento.showPercent');
    const savedShowSeconds = localStorage.getItem('memento.showSeconds');

    if (saved && savedLifespan) {
      setBirthDate(saved);
      setLifespan(parseInt(savedLifespan));
      setIsSetup(true);
    }

    if (savedQuotes) {
      try { setQuotes(JSON.parse(savedQuotes)); } catch {}
    }
    if (savedSelected) {
      try { setSelectedQuotes(new Set(JSON.parse(savedSelected))); } catch {}
    }
    if (savedAccent) setAccentColor(savedAccent);
    if (savedShowQuotes !== null) setShowQuotes(savedShowQuotes === 'true');
    if (savedShowPercent !== null) setShowPercent(savedShowPercent === 'true');
    if (savedShowSeconds !== null) setShowSeconds(savedShowSeconds === 'true');
  }, []);

  /** Calculate death date */
  const getDeathDate = useCallback((): Date | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    try {
      let death = addYears(birth, lifespan);
      // keep same month/day logic as original (approx)
      if (death.getMonth() !== birth.getMonth()) {
        death = new Date(death.getFullYear(), birth.getMonth(), 0);
      }
      return death;
    } catch { return null; }
  }, [birthDate, lifespan]);

  /** Play a short tick */
  const playTick = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      // If suspended (browser policy), attempt to resume (this must be executed in user gesture)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // swallow errors (older browsers)
      // console.error('tick error', e);
    }
  }, []);

  /** Visibility change for audio context */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /**
   * Countdown effect.
   * - When showSeconds is true -> update every 1s
   * - When showSeconds is false -> update every 60s (seconds reported as 0)
   */
  useEffect(() => {
    if (!isSetup) return;
    let mounted = true;

    const computeAndSet = () => {
      const death = getDeathDate();
      if (!death) return;
      const now = Date.now();
      const birthMs = new Date(birthDate).getTime();
      const deathMs = death.getTime();
      const remainingMs = Math.max(0, deathMs - now);

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = showSeconds ? Math.floor((remainingMs % (1000 * 60)) / 1000) : 0;

      if (!mounted) return;
      setCountdown({ days, hours, minutes, seconds });
      setPercent(Math.min(100, Math.max(0, ((now - birthMs) / (deathMs - birthMs)) * 100)));

      // play tick only when enabled and page visible
      if (tickEnabledRef.current && showSeconds && !document.hidden) playTick();
    };

    computeAndSet();

    const intervalMs = showSeconds ? 1000 : 60_000;
    const interval = setInterval(computeAndSet, intervalMs);
    return () => { mounted = false; clearInterval(interval); };
  }, [isSetup, birthDate, lifespan, getDeathDate, showSeconds, playTick]);

  /** Calculate calendar columns and grid cell size so calendar fits without scrolling */
  useEffect(() => {
    const calculateColumns = () => {
      if (!birthDate) return;
      const weeks = getWeeksData();
      const totalWeeks = weeks.length || 52;
      const vw = Math.max(window.innerWidth, 320);
      const vh = Math.max(window.innerHeight, 320);

      // target padding and UI chrome
      const horizontalPadding = 32; // px
      const verticalPadding = 160; // px reserved for header/controls

      // candidate columns based on viewport width
      let cols = 52;
      if (vw < 640) cols = Math.max(10, Math.floor(vw / 18));
      else if (vw < 1024) cols = Math.max(20, Math.floor(vw / 22));
      else cols = Math.min(52, Math.floor(vw / 24));

      // make sure cols not bigger than total weeks
      cols = Math.min(cols, totalWeeks);

      // compute rows and cell size constrained by both width and height
      let rows = Math.ceil(totalWeeks / cols);
      const maxCellByWidth = Math.floor((vw - horizontalPadding) / cols);
      const maxCellByHeight = Math.floor((vh - verticalPadding) / rows);
      let cellSize = Math.max(4, Math.min(maxCellByWidth, maxCellByHeight));

      // if cell too small, increase cols (reduce rows) until cell size acceptable
      while (cellSize < 6 && cols > 8) {
        cols = Math.max(8, Math.floor(cols * 0.9));
        rows = Math.ceil(totalWeeks / cols);
        const wCell = Math.floor((vw - horizontalPadding) / cols);
        const hCell = Math.floor((vh - verticalPadding) / rows);
        cellSize = Math.max(4, Math.min(wCell, hCell));
      }

      setCalendarCols(cols);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [birthDate, lifespan]);

  /** Get weeks data */
  const getWeeksData = () => {
    if (!birthDate) return [];
    const birth = new Date(birthDate);
    const death = getDeathDate();
    if (!death) return [];
    const totalWeeks = Math.ceil(differenceInDays(death, birth) / 7);
    const weeksPassed = Math.floor(differenceInDays(new Date(), birth) / 7);
    return Array.from({ length: totalWeeks }, (_, i) => ({ isPast: i < weeksPassed }));
  };

  /** Setup handler */
  const handleSetup = () => {
    if (!birthDate) return;
    localStorage.setItem('memento.birth', birthDate);
    localStorage.setItem('memento.lifespan', lifespan.toString());
    setIsSetup(true);
  };

  /** Toggle ticking sound — this runs in a user gesture (onClick) so audio can start */
  const handleToggleTick = (next: boolean) => {
    // update refs/state synchronously
    tickEnabledRef.current = next;
    setTickSound(next);

    if (next) {
      // create/resume audio context now that we have a gesture
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      audioContextRef.current.resume().catch(() => {});
      // play an immediate short tick so user gets feedback
      playTick();
    } else {
      // when disabled, suspend audio context if present (free resources)
      if (audioContextRef.current) {
        audioContextRef.current.suspend().catch(() => {});
      }
    }
  };

  /** Download image */
  const handleDownload = async () => {
    if (!containerRef.current) return;
    setCapturing(true);
    setMenuOpen(false);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `memento-mori-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { alert('Failed to create image.'); }
    finally { setCapturing(false); }
  };

  /** UI: Setup screen (note: removed the external anchor per request) */
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-4xl font-bold text-center mb-6">Memento Mori</h1>
          <div className="space-y-4 bg-gray-900 p-6 rounded">
            <div>
              <label className="block mb-2 text-sm font-medium">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Expected Lifespan (years)</label>
              <select
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
                className="w-full bg-black border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {Array.from({ length: 101 }, (_, i) => i + 20).map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-gray-400">
              No external links shown here (removed per request).
            </div>

            <button
              onClick={handleSetup}
              disabled={!birthDate}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // main content
  const weeks = getWeeksData();

  // compute inline grid styles for calendar to fit without scroll:
  const totalWeeks = weeks.length || 52;
  const cols = Math.max(1, Math.min(calendarCols, totalWeeks));
  const rows = Math.ceil(totalWeeks / cols);
  // compute cell size from viewport (mirrors calculation above)
  const vw = Math.max(window.innerWidth, 320);
  const vh = Math.max(window.innerHeight, 320);
  const horizontalPadding = 32;
  const verticalPadding = 160;
  const maxCellByWidth = Math.floor((vw - horizontalPadding) / cols);
  const maxCellByHeight = Math.floor((vh - verticalPadding) / rows);
  const cellSize = Math.max(4, Math.min(maxCellByWidth, maxCellByHeight));

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden relative p-4" data-capturing={capturing}>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Memento Mori</h2>
          <div className="text-sm text-gray-400">Lifespan visualization</div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMode(mode === 'countdown' ? 'calendar' : 'countdown')}
            className="px-3 py-1 bg-gray-800 rounded"
          >
            {mode === 'countdown' ? 'Switch to Calendar' : 'Switch to Countdown'}
          </button>

          <button onClick={handleDownload} className="px-3 py-1 bg-gray-800 rounded">Download</button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Countdown/controls */}
        <section className="space-y-4">
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-gray-400">Percent lived</div>
                <div className="text-3xl font-bold">{percent.toFixed(2)}%</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Time left</div>
                <div className="text-xl">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m{showSeconds ? ` ${countdown.seconds}s` : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Show seconds</label>
              <input
                type="checkbox"
                checked={showSeconds}
                onChange={(e) => {
                  const next = e.target.checked;
                  setShowSeconds(next);
                  localStorage.setItem('memento.showSeconds', next.toString());
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Tick sound</label>
              <input
                type="checkbox"
                checked={tickSound}
                onChange={(e) => handleToggleTick(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Show quotes</label>
              <input
                type="checkbox"
                checked={showQuotes}
                onChange={(e) => { const v = e.target.checked; setShowQuotes(v); localStorage.setItem('memento.showQuotes', v.toString()); }}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Show percent</label>
              <input
                type="checkbox"
                checked={showPercent}
                onChange={(e) => { const v = e.target.checked; setShowPercent(v); localStorage.setItem('memento.showPercent', v.toString()); }}
              />
            </div>
          </div>

          {showQuotes && (
            <div className="bg-gray-900 p-4 rounded">
              <div className="text-sm text-gray-300">{quotes[currentQuoteIndex % quotes.length]}</div>
            </div>
          )}
        </section>

        {/* Right: Calendar view */}
        <section className="bg-gray-900 p-4 rounded overflow-hidden">
          <div className="mb-2 text-sm text-gray-400">Calendar (weeks) — fits viewport</div>

          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridAutoRows: `${cellSize}px`,
              gap: 2,
              justifyContent: 'center',
              alignContent: 'start',
              // prevent inner scrolling
              overflow: 'visible',
            }}
            aria-hidden
          >
            {weeks.map((w, i) => (
              <div
                key={i}
                title={`Week ${i + 1}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: w.isPast ? '#ef4444' : '#111827',
                  opacity: w.isPast ? 1 : 0.35,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-6 text-xs text-gray-500">
        Lifespan: {lifespan} years — Birth: {birthDate}
      </footer>
    </div>
  );
};

export default App;
