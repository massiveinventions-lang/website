import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Zap,
  Leaf,
  Wifi,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  ListMusic,
  Disc3,
} from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "Rich Acoustics",
    desc: "Precision-tuned drivers housed in solid wood for warm, natural resonance.",
  },
  {
    icon: Wifi,
    title: "Seamless Connect",
    desc: "Latest Bluetooth 5.3 for uninterrupted, zero-latency streaming.",
  },
  {
    icon: Leaf,
    title: "Eco Materials",
    desc: "Sustainably sourced walnut, bamboo, and teak for every product.",
  },
  {
    icon: Zap,
    title: "Fast Charging",
    desc: "Next-gen GaN technology and PD support keeps you powered up.",
  },
];

// Royalty-free piano tracks sourced from the FreePD.com CC0 catalog
// (mirrored on GitHub at github.com/0lhi/FreePD). All tracks are public
// domain — no attribution required, free for commercial use.
const TRACKS = [
  { id: "Pond",                    title: "Pond",                    artist: "FreePD · Romance", duration: 371 },
  { id: "Lovely Piano Song",       title: "Lovely Piano Song",       artist: "FreePD · Romance", duration: 233 },
  { id: "Nostalgic Piano",         title: "Nostalgic Piano",         artist: "FreePD · Romance", duration: 479 },
  { id: "Romantic Inspiration",    title: "Romantic Inspiration",    artist: "FreePD · Romance", duration: 365 },
  { id: "Shining Stars",           title: "Shining Stars",           artist: "FreePD · Romance", duration: 341 },
] as const;

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[var(--accent-brown)] font-bold tracking-wider uppercase text-sm mb-4 block">
              The Massive Difference
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--foreground)] mb-6 leading-tight">
              Designed For <br /> Modern Listening.
            </h2>
            <p className="text-lg text-[var(--foreground)]/70 mb-8 max-w-lg">
              We don't just build electronics. We craft acoustic instruments that blend the timeless warmth of wood with cutting-edge internal components.
            </p>
            <MusicPlayer />
          </motion.div>

          <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group bg-[var(--soft-gray)] p-8 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[var(--soft-gray)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:bg-[var(--accent-brown)] transition-colors duration-300">
                  <feat.icon className="w-7 h-7 text-[var(--foreground)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">{feat.title}</h3>
                <p className="text-[var(--foreground)]/70">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(TRACKS[0].duration);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentTrack = TRACKS[trackIndex];

  // Keep the audio element in sync with the selected track.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsReady(false);
    setError(null);
    audio.src = `/audio/${currentTrack.id}.mp3`;
    audio.load();
    // If the user was already playing, resume on the new track.
    if (isPlaying) {
      audio.play().catch(() => {
        // autoplay can fail silently — surface via state.
        setIsPlaying(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  // Apply volume / mute changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  // Keyboard shortcut: space toggles play/pause when the player has focus.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      togglePlay();
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Could not play");
          setIsPlaying(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const playIndex = (i: number) => {
    if (i < 0 || i >= TRACKS.length) return;
    setTrackIndex(i);
    setIsPlaying(true);
  };

  const prev = () => {
    if (currentTime > 3) {
      // Restart current track if we're past 3s in.
      const audio = audioRef.current;
      if (audio) audio.currentTime = 0;
    } else {
      playIndex((trackIndex - 1 + TRACKS.length) % TRACKS.length);
    }
  };

  const next = () => playIndex((trackIndex + 1) % TRACKS.length);

  // Click-to-seek on the progress bar.
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-[var(--foreground)] text-white border border-[var(--foreground)]/10"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Music player"
    >
      {/* Background — soft gradient like the original video placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--retro-cream)] via-[var(--accent-light)]/20 to-[var(--accent-brown)]/20" />
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--accent-brown)]/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[var(--accent-light)]/15 blur-2xl pointer-events-none" />

      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (a.duration && isFinite(a.duration)) {
            setDuration(a.duration);
          }
          setIsReady(true);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          // Auto-advance to the next track when one finishes.
          if (trackIndex < TRACKS.length - 1) {
            playIndex(trackIndex + 1);
          } else {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
        onError={() => {
          setError("Track not available. Drop your own .mp3 into /public/audio/.");
          setIsPlaying(false);
        }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Header: album art + track info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
            <Disc3
              className={`w-9 h-9 text-white ${isPlaying ? "animate-spin" : ""}`}
              style={{ animationDuration: "4s" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
              Now playing
            </p>
            <p className="text-lg font-black text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPlaylist((v) => !v)}
            aria-label="Toggle playlist"
            aria-expanded={showPlaylist ? "true" : "false"}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="group relative h-1.5 w-full rounded-full bg-white/15 cursor-pointer mb-2"
          role="slider"
          aria-label="Track progress"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.floor(duration))}
          aria-valuenow={Math.max(0, Math.floor(currentTime))}
          tabIndex={0}
        >
          <div
            className="h-full rounded-full bg-[var(--accent-brown)] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time + controls */}
        <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous track"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-14 h-14 rounded-full bg-white text-[var(--foreground)] hover:bg-[var(--accent-light)] transition-colors flex items-center justify-center shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next track"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (Number(e.target.value) > 0) setIsMuted(false);
              }}
              aria-label="Volume"
              className="w-20 sm:w-24 accent-white"
            />
          </div>
        </div>

        {/* Error / placeholder hint */}
        {error && (
          <p className="mt-3 text-[11px] text-white/70 text-center">{error}</p>
        )}
        {!error && !isReady && !isPlaying && (
          <p className="mt-3 text-[10px] text-white/40 text-center">
            Royalty-free piano — drop your own audio at <code>/public/audio/{currentTrack.id}.mp3</code>
          </p>
        )}

        {/* Playlist */}
        {showPlaylist && (
          <ul className="mt-4 pt-4 border-t border-white/10 space-y-1">
            {TRACKS.map((t, i) => {
              const active = i === trackIndex;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => playIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                      active
                        ? "bg-white/15"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        active
                          ? "bg-[var(--accent-brown)] text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {active && isPlaying ? (
                        <Music2 className="w-3.5 h-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          active ? "text-white" : "text-white/80"
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[11px] text-white/50 truncate">
                        {t.artist} · {formatTime(t.duration)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}