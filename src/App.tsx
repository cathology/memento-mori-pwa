import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Menu, X, Calendar, Clock, Plus, Trash2, Download } from 'lucide-react';
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

const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const differenceInDays = (date1: Date | number, date2: Date | number): number => {
  const d1 = typeof date1 === 'number' ? date1 : date1.getTime();
  const d2 = typeof date2 === 'number' ? date2 : date2.getTime();
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
};

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
      try {
        setQuotes(JSON.parse(savedQuotes));
      } catch (e) {
        console.error('Error loading quotes:', e);
      }
    }
    if (savedSelected) {
      try {
        setSelectedQuotes(new Set(JSON.parse(savedSelected)));
      } catch (e) {
        console.error('Error loading selected quotes:', e);
      }
    }
    if (savedAccent) {
      setAccentColor(savedAccent);
    }
    if (savedShowQuotes !== null) {
      setShowQuotes(savedShowQuotes === 'true');
    }
    if (savedShowPercent !== null) {
      setShowPercent(savedShowPercent === 'true');
    }
    if (savedShowSeconds !== null) {
      setShowSeconds(savedShowSeconds === 'true');
    }
  }, []);

  const getDeathDate = useCallback((): Date | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    try {
      let death = addYears(birth, lifespan);
      
      if (death.getMonth() !== birth.getMonth()) {
        death = new Date(death.getFullYear(), birth.getMonth(), 0);
      }
      
      return death;
    } catch (error) {
      console.error('Error calculating death date:', error);
      return null;
    }
  }, [birthDate, lifespan]);

  const getWeeksData = useCallback(() => {
    if (!birthDate) return [];
    const birth = new Date(birthDate);
    const death = getDeathDate();
    if (!death) return [];
    
    const totalDays = differenceInDays(death, birth);
    const totalWeeks = Math.ceil(totalDays / 7);
    const now = Date.now();
    const weeksPassed = Math.floor(differenceInDays(now, birth.getTime()) / 7);
    
    return Array.from({ length: totalWeeks }, (_, i) => ({
      isPast: i < weeksPassed
    }));
  }, [birthDate, getDeathDate]);

  useEffect(() => {
    if (!isSetup) return;

    const updateCountdown = () => {
      const death = getDeathDate();
      if (!death) return;

      const now = Date.now();
      const birth = new Date(birthDate).getTime();
      const deathMs = death.getTime();
      const remainingMs = Math.max(0, deathMs - now);

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });

      const pct = Math.min(100, Math.max(0, ((now - birth) / (deathMs - birth)) * 100));
      setPercent(pct);

      if (tickSound && !document.hidden) {
        playTick();
      }
    };

    updateCountdown();
    
    const now = Date.now();
    const delay = 1000 - (now % 1000);
    const timeout = setTimeout(() => {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [isSetup, birthDate, lifespan, tickSound, getDeathDate]);

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioContextRef.current) {
        audioContextRef.current.suspend();
      } else if (audioContextRef.current) {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const calculateColumns = () => {
      if (typeof window === 'undefined') return;
      
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const weeks = getWeeksData();
      
      let cols;
      if (vw < 640) {
        cols = Math.max(15, Math.min(25, Math.floor(vw / 20)));
      } else if (vw < 1024) {
        cols = Math.max(30, Math.min(40, Math.floor(vw / 22)));
      } else {
        cols = Math.min(52, Math.floor(vw / 24));
      }
      
      const rows = Math.ceil(weeks.length / cols);
      const availableHeight = vh * 0.7;
      const cellSize = availableHeight / rows;
      
      if (cellSize < 6) {
        cols = Math.ceil(weeks.length / Math.floor(availableHeight / 6));
      }
    
      setCalendarCols(cols);
    };
  
    calculateColumns();
  
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [birthDate, lifespan, getWeeksData]);

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
    } catch (error) {
      console.error('Error playing tick:', error);
    }
  };

  const handleSetup = () => {
    if (!birthDate) return;
    
    localStorage.setItem('memento.birth', birthDate);
    localStorage.setItem('memento.lifespan', lifespan.toString());
    setIsSetup(true);
  };

  const switchMode = () => {
    setFlipping(true);
    setTimeout(() => {
      setMode(mode === 'countdown' ? 'calendar' : 'countdown');
      setFlipping(false);
    }, 300);
  };

  const handleDownload = async () => {
    if (!containerRef.current) return;
    
    setCapturing(true);
    setMenuOpen(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `memento-mori-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to create image. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleShareNative = async () => {
    if (!containerRef.current) return;
    
    setCapturing(true);
    setMenuOpen(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'memento-mori.png', { type: 'image/png' });
      
      await navigator.share({
        files: [file],
        title: 'Memento Mori',
        text: 'Remember that you must die',
      });
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setCapturing(false);
    }
  };

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
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedQuotes(updated);
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(updated)));
  };

  const deleteQuote = (index: number) => {
    const updated = quotes.filter((_, i) => i !== index);
    setQuotes(updated);
    const newSelected = new Set(
      Array.from(selectedQuotes)
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i)
    );
    setSelectedQuotes(newSelected);
    localStorage.setItem('memento.quotes', JSON.stringify(updated));
    localStorage.setItem('memento.selectedQuotes', JSON.stringify(Array.from(newSelected)));
  };

  const saveSetting = (key: string, value: any) => {
    localStorage.setItem(`memento.${key}`, value.toString());
  };

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
                aria-label="Birth date"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Expected Lifespan (years)</label>
              <select
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                aria-label="Expected lifespan"
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
    <div 
      ref={containerRef} 
      className="min-h-screen bg-black text-white overflow-hidden relative"
      data-capturing={capturing}
    >
      {!capturing && (
        <>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <button
            onClick={switchMode}
            className="fixed bottom-4 right-4 z-50 p-3 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={`Switch to ${mode === 'countdown' ? 'calendar' : 'countdown'} mode`}
          >
            {mode === 'countdown' ? <Calendar size={24} /> : <Clock size={24} />}
          </button>

          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Download image"
              title="Download image"
            >
              <Download size={20} />
            </button>
            
            {navigator.share !== undefined && (
              <button
                onClick={handleShareNative}
                className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Share"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            )}
          </div>
        </>
      )}

      {menuOpen && !capturing && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-40 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6 pt-16">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
                <span>Show Quotes</span>
                <input
                  type="checkbox"
                  checked={showQuotes}
                  onChange={(e) => {
                    setShowQuotes(e.target.checked);
                    saveSetting('showQuotes', e.target.checked);
                  }}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
                <span>Show Percentage</span>
                <input
                  type="checkbox"
                  checked={showPercent}
                  onChange={(e) => {
                    setShowPercent(e.target.checked);
                    saveSetting('showPercent', e.target.checked);
                  }}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
                <span>Show Seconds</span>
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={(e) => {
                    setShowSeconds(e.target.checked);
                    saveSetting('showSeconds', e.target.checked);
                  }}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-gray-900 rounded hover:bg-gray-800 cursor-pointer">
                <span>Ticking Sound</span>
                <input
                  type="checkbox"
                  checked={tickSound}
                  onChange={(e) => setTickSound(e.target.checked)}
                  className="w-5 h-5"
                />
              </label>
            </div>
            
            <div className="pt-4">
              <label className="block mb-3 font-medium">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { color: '#ef4444', name: 'Red' },
                  { color: '#f59e0b', name: 'Amber' },
                  { color: '#10b981', name: 'Green' },
                  { color: '#3b82f6', name: 'Blue' },
                  { color: '#8b5cf6', name: 'Purple' },
                  { color: '#ec4899', name: 'Pink' }
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => {
                      setAccentColor(color);
                      saveSetting('accentColor', color);
                    }}
                    className="w-12 h-12 rounded-full border-4 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                    style={{ 
                      backgroundColor: color,
                      borderColor: accentColor === color ? '#fff' : color,
                      transform: accentColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                    aria-label={`Select ${name} color`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-medium mb-3">Manage Quotes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quotes.map((quote, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-900 rounded">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.has(index)}
                      onChange={() => toggleQuote(index)}
                      className="mt-1 flex-shrink-0"
                    />
                    <span className="flex-1 text-sm">{quote}</span>
                    {index >= DEFAULT_QUOTES.length && (
                      <button
                        onClick={() => deleteQuote(index)}
                        className="text-red-400 hover:text-red-300 flex-shrink-0"
                        aria-label="Delete quote"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomQuote()}
                  placeholder="Add custom quote..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  onClick={addCustomQuote}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                  aria-label="Add quote"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (confirm('Clear all data and reset the app?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 py-3 rounded font-medium transition-colors mt-6"
            >
              Clear All Data & Reset
            </button>
          </div>
        </div>
      )}

      <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-300 ${
          flipping ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {mode === 'countdown' ? (
          <div className="text-center w-full">
            <div
              className="font-mono font-bold mb-8 tabular-nums"
              style={{ 
                color: accentColor,
                fontSize: 'clamp(2rem, 12vw, 8rem)',
                lineHeight: 1.2
              }}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes${showSeconds ? `, ${countdown.seconds} seconds` : ''} remaining`}
            >
              {countdown.days}:{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}
              {showSeconds && `:${String(countdown.seconds).padStart(2, '0')}`}
            </div>
            
            {showPercent && (
              <div className="max-w-2xl mx-auto mb-8 px-4">
                <div 
                  className="h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Life progress"
                >
                  <div
                    className="h-full transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${percent}%`,
                      backgroundColor: accentColor
                    }}
                  />
                </div>
                <div 
                  className="text-lg md:text-2xl mt-3 font-medium"
                  style={{ color: accentColor }}
                >
                  {percent.toFixed(2)}% of your life is over
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center p-4 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
            <div
              className="grid gap-0.5 md:gap-1"
              style={{
                gridTemplateColumns: `repeat(${calendarCols}, minmax(0, 1fr))`,
                width: '100%',
                maxWidth: '100%',
                height: 'fit-content',
                maxHeight: '100%'
              }}
              role="img"
              aria-label={`Life calendar showing ${weeks.filter(w => w.isPast).length} weeks lived out of ${weeks.length} total weeks`}
            >
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    aspectRatio: '1',
                    width: '100%',
                    maxWidth: '16px',
                    maxHeight: '16px',
                    minWidth: '3px',
                    minHeight: '3px',
                    backgroundColor: week.isPast ? accentColor : 'transparent',
                    border: week.isPast ? 'none' : `1px solid ${accentColor}`
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        )}

        {showQuotes && !capturing && Array.from(selectedQuotes).length > 0 && (
          <div 
            className="fixed bottom-16 md:bottom-20 left-0 right-0 text-center px-4"
            role="region"
            aria-live="polite"
            aria-label="Rotating quote"
          >
            <p className="text-sm md:text-base text-gray-300 italic max-w-2xl mx-auto leading-relaxed">
              "{quotes[currentQuoteIndex]}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
