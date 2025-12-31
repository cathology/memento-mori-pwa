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

  // Load settings from localStorage
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

  // Compute death date
  const getDeathDate = useCallback((): Date | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    let death = addYears(birth, lifespan);
    if (death.getMonth() !== birth.getMonth()) {
      death = new Date(death.getFullYear(), birth.getMonth(), 0);
    }
    return death;
  }, [birthDate, lifespan]);

  // Countdown effect
  useEffect(() => {
    if (!isSetup) return;

    const updateCountdown = () => {
      const death = getDeathDate();
      if (!death) return;

      const now = Date.now();
      const birth = new Date(birthDate).getTime();
      const remainingMs = Math.max(0, death.getTime() - now);

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });

      const pct = Math.min(100, Math.max(0, ((now - birth) / (death.getTime() - birth)) * 100));
      setPercent(pct);

      if (tickSound && !document.hidden) playTick();
    };

    const now = Date.now();
    const delay = 1000 - (now % 1000);
    let interval: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [isSetup, birthDate, lifespan, tickSound, getDeathDate]);

  // Quote rotation
  useEffect(() => {
    if (!showQuotes) return;
    const activeQuotes = Array.from(selectedQuotes);
    if (activeQuotes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => {
        const currentPos = activeQuotes.indexOf(prev);
        const nextPos = (currentPos + 1) % activeQuotes.length;
        return activeQuotes[nextPos];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [showQuotes, selectedQuotes]);

  // Handle visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioContextRef.current) audioContextRef.current.suspend();
      else if (audioContextRef.current) audioContextRef.current.resume();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Responsive calendar columns
  useEffect(() => {
    const calculateColumns = () => {
      if (!birthDate) return;
      const vw = window.innerWidth;
      let cols = 52;
      if (vw < 640) cols = Math.max(15, Math.min(25, Math.floor(vw / 20)));
      else if (vw < 1024) cols = Math.max(30, Math.min(40, Math.floor(vw / 22)));
      else cols = Math.min(52, Math.floor(vw / 24));
      setCalendarCols(cols);
    };
    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [birthDate, lifespan]);

  // Play tick sound
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

  // Handle setup
  const handleSetup = () => {
    if (!birthDate) return;
    localStorage.setItem('memento.birth', birthDate);
    localStorage.setItem('memento.lifespan', lifespan.toString());
    setIsSetup(true);
  };

  // Switch modes
  const switchMode = () => {
    setFlipping(true);
    setTimeout(() => {
      setMode(mode === 'countdown' ? 'calendar' : 'countdown');
      setFlipping(false);
    }, 300);
  };

  // Download image
  const handleDownload = async () => {
    if (!containerRef.current) return;
    setCapturing(true);
    setMenuOpen(false);
    await new Promise(r => setTimeout(r, 100));
    try {
      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `memento-mori-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { alert('Failed to create image.'); }
    setCapturing(false);
  };

  // Share natively
  const handleShareNative = async () => {
    if (!containerRef.current || !navigator.share) return;
    setCapturing(true);
    setMenuOpen(false);
    await new Promise(r => setTimeout(r, 100));
    try {
      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'memento-mori.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Memento Mori', text: 'Remember that you must die' });
    } catch {}
    setCapturing(false);
  };

  // Generate weeks
  const getWeeksData = () => {
    if (!birthDate) return [];
    const birth = new Date(birthDate);
    const death = getDeathDate();
    if (!death) return [];
    const totalWeeks = Math.ceil(differenceInDays(death, birth) / 7);
    const weeksPassed = Math.floor(differenceInDays(new Date(), birth) / 7);
    return Array.from({ length: totalWeeks }, (_, i) => ({ isPast: i < weeksPassed }));
  };

  const weeks = getWeeksData();

  // Quote handlers
  const addCustomQuote = () => {
    if (!newQuote.trim()) return;
    const updated = [...quotes, newQuote];
    setQuotes(updated);
    setSelectedQuotes(new Set([...selectedQuotes, updated.length - 1]));
    localStorage.setItem('memento.quotes', JSON.stringify(updated));
    setNewQuote('');
  };

  const toggleQuote = (index: number) => {
    const updated = new Set(selectedQuotes);
    updated.has(index) ? updated.delete(index) : updated.add(index);
    setSelectedQuotes(updated);
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(updated)));
  };

  const deleteQuote = (index: number) => {
    const updated = quotes.filter((_, i) => i !== index);
    const newSelected = new Set(Array.from(selectedQuotes).filter(i => i !== index).map(i => i > index ? i - 1 : i));
    setQuotes(updated);
    setSelectedQuotes(newSelected);
    localStorage.setItem('memento.quotes', JSON.stringify(updated));
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(newSelected)));
  };

  const saveSetting = (key: string, value: any) => localStorage.setItem(`memento.${key}`, value.toString());

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
                {Array.from({ length: 101 }, (_, i) => i + 20).map(y => <option key={y} value={y}>{y} years</option>)}
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

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden relative" data-capturing={capturing}>
      {/* Menu, Switch, Download/Share buttons */}
      {!capturing && (
        <>
          <button onClick={() => setMenuOpen(!menuOpen)} className="fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <button onClick={switchMode} className="fixed bottom-4 right-4 z-50 p-3 bg-gray-900 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white">
            {mode === 'countdown' ? <Calendar size={24} /> : <Clock size={24} />}
          </button>
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button onClick={handleDownload} className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white">
              <Download size={20} />
            </button>
            {navigator.share && <button onClick={handleShareNative} className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white"><Share2 size={20} /></button>}
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-300 ${flipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {mode === 'countdown' ? (
          <div className="text-center w-full">
            <div className="font-mono font-bold mb-8 tabular-nums" style={{ color: accentColor, fontSize: 'clamp(2rem, 12vw, 8rem)', lineHeight: 1.2 }} role="timer" aria-live="polite" aria-atomic="true">
              {countdown.days}:{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}{showSeconds && `:${String(countdown.seconds).padStart(2, '0')}`}
            </div>
            {showPercent && (
              <div className="max-w-2xl mx-auto mb-8 px-4">
                <div className="h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${percent}%`, backgroundColor: accentColor }} />
                </div>
                <div className="text-lg md:text-2xl mt-3 font-medium" style={{ color: accentColor }}>{percent.toFixed(2)}% of your life is over</div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center p-4 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
            <div className="grid gap-0.5 md:gap-1" style={{ gridTemplateColumns: `repeat(${calendarCols}, minmax(0, 1fr))`, width: '100%', maxWidth: '100%' }} role="img" aria-label={`Life calendar showing ${weeks.filter(w => w.isPast).length} weeks lived out of ${weeks.length} total weeks`}>
              {weeks.map((week, i) => (
                <div key={i} className={`aspect-square rounded-sm ${week.isPast ? 'bg-red-600' : 'bg-gray-900'} transition-colors`} />
              ))}
            </div>
          </div>
        )}
        {showQuotes && quotes.length > 0 && (
          <div className="mt-8 text-center max-w-3xl px-4 text-gray-300 italic text-sm md:text-lg">
            "{quotes[currentQuoteIndex]}"
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
