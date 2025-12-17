"use client";

import { useState } from "react";
import * as Tone from "tone";

export default function SoundsPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  async function playFunnySound() {
    if (isPlaying) return;
    
    setIsPlaying(true);
    await Tone.start();

    const now = Tone.now();
    
    // Formant frequencies for vowel sounds (in Hz)
    // These create the characteristic "voice" quality
    const vowels = [
      // "He" - like "hello"
      { f1: 270, f2: 2290, f3: 3010, duration: 0.15 },
      // "ll" - transition
      { f1: 390, f2: 1990, f3: 2550, duration: 0.1 },
      // "o" - like "hello"
      { f1: 300, f2: 870, f3: 2240, duration: 0.2 },
    ];

    vowels.forEach((vowel, i) => {
      const startTime = now + i * 0.2;
      
      // Fundamental frequency (voice pitch) - varies slightly for naturalness
      const fundamental = 120 + Math.sin(i) * 20;
      const osc = new Tone.Oscillator({
        type: "sawtooth", // Sawtooth has harmonics needed for formants
        frequency: fundamental,
      });

      // Create formant filters to shape the vowel sound
      const f1Filter = new Tone.Filter({
        type: "bandpass",
        frequency: vowel.f1,
        Q: 8,
      });

      const f2Filter = new Tone.Filter({
        type: "bandpass",
        frequency: vowel.f2,
        Q: 6,
      });

      const f3Filter = new Tone.Filter({
        type: "bandpass",
        frequency: vowel.f3,
        Q: 4,
      });

      // Mix the formants
      const f1Gain = new Tone.Gain(0.4);
      const f2Gain = new Tone.Gain(0.3);
      const f3Gain = new Tone.Gain(0.2);
      const masterGain = new Tone.Gain(0.15).toDestination();

      // Connect: oscillator -> formant filters -> gains -> master
      osc.connect(f1Filter);
      osc.connect(f2Filter);
      osc.connect(f3Filter);
      
      f1Filter.connect(f1Gain);
      f2Filter.connect(f2Gain);
      f3Filter.connect(f3Gain);
      
      f1Gain.connect(masterGain);
      f2Gain.connect(masterGain);
      f3Gain.connect(masterGain);

      // Envelope for natural attack/decay
      const envelope = new Tone.Envelope({
        attack: 0.02,
        decay: 0.05,
        sustain: 0.7,
        release: 0.1,
      }).connect(masterGain.gain);

      osc.start(startTime);
      envelope.triggerAttackRelease(vowel.duration, startTime);
      osc.stop(startTime + vowel.duration + 0.1);
    });

    setTimeout(() => setIsPlaying(false), 1000);
  }

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Sounds
        </h1>
        
        <div className="space-y-6 text-white/90 text-lg md:text-xl leading-relaxed mb-12">
          <p>
            Welcome to the sounds page! This is where I experiment with audio and create fun sound effects.
          </p>
          <p>
            Click the button below to hear a speech-like sound I made using formant synthesis and Tone.js. 
            It uses formant filters to create vowel sounds that mimic human speech!
          </p>
        </div>

        <button
          onClick={playFunnySound}
          disabled={isPlaying}
          className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all backdrop-blur-sm border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
        >
          {isPlaying ? "Speaking..." : "🗣️ Play Talking Sound 🗣️"}
        </button>

        <div className="mt-12 text-white/70 text-base">
          <p className="mb-4">💡 Tip: Make sure your volume is on!</p>
          <p>
            This sound is generated in real-time using formant synthesis with Tone.js. 
            Formants are resonant frequencies that give vowels their characteristic sound. 
            The sound mimics speech by using multiple bandpass filters tuned to formant frequencies.
          </p>
        </div>
      </div>
    </main>
  );
}
