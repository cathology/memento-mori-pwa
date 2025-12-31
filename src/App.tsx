import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Menu, X, Calendar, Clock, Plus, Trash2, Download } from 'lucide-react';
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
      if (death.getMonth() !== birth.getMonth()) {
        death = new Date(death.getFullYear(), birth.getMonth(), 0);
      }
      return death;
    } catch { return null; }
  }, [birthDate, lifespan]);

  /** Countdown effect */
  useEffect(() => {
    if (!isSetup) return;

    const updateCountdown = () => {
      const death = getDeathDate();
      if (!death) return;

      const now = Date.now();
      const birthMs = new Date(birthDate).getTime();
      const deathMs = death.getTime();
      const remainingMs = Math.max(0, deathMs - now);

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
      setPercent(Math.min(100, Math.max(0, ((now - birthMs) / (deathMs - birthMs)) * 100)));

      if (tickSound && !document.hidden) playTick();
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isSetup, birthDate, lifespan, tickSound, getDeathDate]);

  /** Rotate quotes */
  useEffect(() => {
    if (!showQuotes || selectedQuotes.size === 0) return;

    const activeQuotes = Array.from(selectedQuotes);
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => {
        const currentPos = activeQuotes.indexOf(prev);
        const nextPos = (currentPos + 1) % activeQuotes.length;
        return activeQuotes[nextPos];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [showQuotes, selectedQuotes]);

  /** Visibility change for audio context */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioContextRef.current) return;
      document.hidden ? audioContextRef.current.suspend() : audioContextRef.current.resume();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /** Calculate calendar columns */
  useEffect(() => {
    const calculateColumns = () => {
      if (!birthDate) return;
      const weeks = getWeeksData();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let cols = 52;

      if (vw < 640) cols = Math.max(15, Math.min(25, Math.floor(vw / 20)));
      else if (vw < 1024) cols = Math.max(30, Math.min(40, Math.floor(vw / 22)));
      else cols = Math.min(52, Math.floor(vw / 24));

      const rows = Math.ceil(weeks.length / cols);
      const cellSize = (vh * 0.7) / rows;
      if (cellSize < 6) cols = Math.ceil(weeks.length / Math.floor((vh * 0.7) / 6));

      setCalendarCols(cols);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [birthDate, lifespan]);

  /** Helper: play tick */
  const playTick = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  /** Setup handler */
  const handleSetup = () => {
    if (!birthDate) return;
    localStorage.setItem('memento.birth', birthDate);
    localStorage.setItem('memento.lifespan', lifespan.toString());
    setIsSetup(true);
  };

  /** Switch mode */
  const switchMode = () => {
    setFlipping(true);
    setTimeout(() => { setMode(mode === 'countdown' ? 'calendar' : 'countdown'); setFlipping(false); }, 300);
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

  /** Share via native share */
  const handleShareNative = async () => {
    if (!containerRef.current || !navigator.share) return;
    setCapturing(true);
    setMenuOpen(false);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'memento-mori.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Memento Mori', text: 'Remember that you must die' });
    } catch {}
    finally { setCapturing(false); }
  };

  /** Get weeks data */
  const getWeeksData = () => {
    if (!birthDate) return [];
    const birth = new Date(birthDate);
    const death = getDeathDate();
    if (!death) return [];
    const totalWeeks = Math.ceil(differenceInDays(death, birth) / 7);
    const weeksPassed = Math.floor(differenceInDays(Date.now(), birth) / 7);
    return Array.from({ length: totalWeeks }, (_, i) => ({ isPast: i < weeksPassed }));
  };

  /** Add custom quote */
  const addCustomQuote = () => {
    if (!newQuote.trim()) return;
    const updated = [...quotes, newQuote];
    setQuotes(updated);
    setSelectedQuotes(new Set([...selectedQuotes, updated.length - 1]));
    localStorage.setItem('memento.quotes', JSON.stringify(updated));
    setNewQuote('');
  };

  /** Toggle quote selection */
  const toggleQuote = (index: number) => {
    const updated = new Set(selectedQuotes);
    updated.has(index) ? updated.delete(index) : updated.add(index);
    setSelectedQuotes(updated);
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(updated)));
  };

  /** Delete quote */
  const deleteQuote = (index: number) => {
    const updated = quotes.filter((_, i) => i !== index);
    const newSelected = new Set(Array.from(selectedQuotes).filter(i => i !== index).map(i => i > index ? i - 1 : i));
    setQuotes(updated);
    setSelectedQuotes(newSelected);
    localStorage.setItem('memento.quotes', JSON.stringify(updated));
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(newSelected)));
  };

  /** Save a setting */
  const saveSetting = (key: string, value: any) => localStorage.setItem(`memento.${key}`, value.toString());

  /** Setup screen */
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-4xl font-bold text-center mb-8">Memento Mori</h1>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Expected Lifespan (years)</label>
              <select
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {Array.from({ length: 101 }, (_, i) => i + 20).map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>
            <a
              href="https://media.nmfn.com/tnetwork/lifespan/index.html#0"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-blue-400 hover:underline text-sm py-2"
            >
              Calculate my lifespan (external site)
            </a>
            <button
              onClick={handleSetup}
              disabled={!birthDate}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-black"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weeks = getWeeksData();

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden relative" data-capturing={capturing}>
      {/* ... rest of your countdown/calendar JSX and menu JSX remains the same ... */}
    </div>
  );
};

export default App;
