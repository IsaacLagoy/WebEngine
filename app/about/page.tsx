"use client";

import { useEffect } from "react";
import * as Tone from "tone";

export default function SpaceSoundPage() {
  useEffect(() => {
    async function start() {
      await Tone.start();

      // Deep ambient pad
      const pad = new Tone.Oscillator({
        type: "sine",
        frequency: 80
      }).start();

      const padFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 600,
        Q: 2
      });

      const padGain = new Tone.Gain(0.25).toDestination();

      pad.connect(padFilter).connect(padGain);

      // Slow LFO to make the pad "breathe"
      const padLFO = new Tone.LFO({
        frequency: 0.05,
        min: 50,
        max: 200
      }).start();
      padLFO.connect(pad.frequency);

      // Space wind (filtered noise)
      const noise = new Tone.Noise("pink").start();

      const windFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 1500,
        Q: 2
      });

      const windGain = new Tone.Gain(0.15).toDestination();

      noise.connect(windFilter).connect(windGain);

      // Gentle sweeping of the wind filter
      const windLFO = new Tone.LFO({
        frequency: 0.02,
        min: 300,
        max: 4000
      }).start();
      windLFO.connect(windFilter.frequency);

      // Occasional subtle "space blips"
      const blip = new Tone.Oscillator("sine").start();
      const blipGain = new Tone.Gain(0).toDestination();
      blip.connect(blipGain);

      function scheduleBlip(time: number) {
        const freq = 400 + Math.random() * 1200;
        const dur = 0.1 + Math.random() * 0.2;

        blip.frequency.setValueAtTime(freq, time);
        blipGain.gain.setValueAtTime(0, time);
        blipGain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        blipGain.gain.linearRampToValueAtTime(0, time + dur);

        const next = time + 4 + Math.random() * 6;
        Tone.Transport.scheduleOnce(scheduleBlip, next);
      }

      Tone.Transport.scheduleOnce(scheduleBlip, Tone.now());
      Tone.Transport.start();
    }

    start();
  }, []);

  return <div>Space Sound Test</div>;
}
