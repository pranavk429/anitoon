"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  Shuffle,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import type { ParsedPrompt } from "@/lib/mascot/spec";
import { SAMPLE_PROMPTS } from "@/lib/mascot/presets";

type SpeechResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechResult;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechConstructor = new () => SpeechRecognitionLike;

export function BriefPanel({
  prompt,
  setPrompt,
  onGenerate,
  onSurprise,
  compiling,
  compileStatus,
  signals,
  autoFocus,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: (text?: string) => void;
  onSurprise: () => void;
  compiling: boolean;
  compileStatus: string;
  signals: ParsedPrompt["signals"] | null;
  autoFocus?: boolean;
}) {
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setVoiceSupported(Boolean(Ctor));
    return () => {
      recognition.current?.abort();
    };
  }, []);

  const startVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceNote(
        "Voice input isn't available in this browser. Type the brief, or use Wispr Flow to dictate into the box.",
      );
      return;
    }
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    recognition.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) setPrompt(finalText.trim());
    };
    rec.onerror = (event) => {
      setListening(false);
      setInterim("");
      if (event.error === "not-allowed") {
        setVoiceNote(
          "Microphone permission was blocked. Allow it in your browser, or just type.",
        );
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        setVoiceNote(
          "That take didn't come through. Try again, or type the brief.",
        );
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      const text = finalText.trim() || promptRef.current;
      if (finalText.trim()) {
        setVoiceNote(null);
        onGenerate(finalText.trim());
      } else {
        setVoiceNote("No speech detected — the box is yours.");
      }
    };
    try {
      rec.start();
      setListening(true);
      setVoiceNote(null);
      setInterim("");
    } catch {
      setVoiceNote("The microphone is busy. Give it a second and try again.");
    }
  };

  const disabled = compiling || !prompt.trim();

  return (
    <section
      aria-labelledby="brief-heading"
      className="rounded-2xl border-2 border-ink bg-white p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-butter font-mono text-[9px] font-bold shadow-[1px_1px_0_#17151C]">
            01
          </span>
          <h2 id="brief-heading" className="font-display text-lg font-extrabold">
            The brief
          </h2>
        </div>
        <span className="mono-label">one sentence</span>
      </div>

      <label htmlFor="brief" className="sr-only">
        Describe your mascot
      </label>
      <textarea
        id="brief"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (!disabled) onGenerate();
          }
        }}
        rows={3}
        autoFocus={autoFocus}
        maxLength={220}
        placeholder="A mischievous fox for our developer tool, cobalt accents, sparkly eyes…"
        className="field resize-none !text-[13px] leading-relaxed"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <button
          type="button"
          onClick={startVoice}
          className={clsx(
            "chip !py-1.5 transition-colors",
            listening ? "bg-coral text-ink" : "bg-white",
          )}
          aria-pressed={listening}
          title={
            voiceSupported === false
              ? "Voice input isn't supported in this browser"
              : "Dictate the brief"
          }
        >
          {listening ? (
            <MicOff size={12} strokeWidth={2.6} />
          ) : (
            <Mic size={12} strokeWidth={2.6} />
          )}
          {listening ? "Listening…" : "Voice"}
          {voiceSupported === false && (
            <span className="text-[8px] opacity-60">n/a</span>
          )}
        </button>
        <span className="font-mono text-[9px] text-ink-soft">
          {prompt.length}/220 · ⌘↵
        </span>
      </div>

      {listening && (
        <div className="mt-2 rounded-lg border-2 border-dashed border-coral bg-coral/10 px-2.5 py-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-coral">
            Recording
          </p>
          <p className="mt-1 min-h-[18px] text-[12px] italic text-ink/70">
            {interim || "Say the brief…"}
          </p>
        </div>
      )}

      {voiceNote && (
        <p className="mt-2 rounded-lg border border-ink/15 bg-paper px-2.5 py-2 text-[11px] leading-snug text-ink/65">
          {voiceNote}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onGenerate()}
          disabled={disabled}
          className="btn btn-primary flex-1 !min-h-[40px] disabled:opacity-50"
        >
          {compiling ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {compileStatus || "Compiling"}
            </>
          ) : (
            <>
              Generate
              <ArrowRight size={14} />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSurprise}
          disabled={compiling}
          className="btn !min-h-[40px] !px-3 disabled:opacity-50"
          title="Generate a surprise mascot"
        >
          <Shuffle size={14} />
          <span className="hidden sm:inline">Surprise</span>
        </button>
      </div>

      <div className="mt-3">
        <p className="mono-label mb-1.5">Or start from one of these</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.slice(0, 3).map((sample, i) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setPrompt(sample);
                onGenerate(sample);
              }}
              className="chip !py-1.5 text-[9px] hover:bg-butter"
            >
              <Sparkles size={10} />
              {["Sunny cat", "Dev fox", "Sleepy blob"][i]}
            </button>
          ))}
        </div>
      </div>

      {signals && (
        <div className="mt-3 rounded-xl border-2 border-dashed border-ink/20 bg-paper/60 p-2.5">
          <p className="mono-label mb-1.5">Compiler notes</p>
          <div className="flex flex-wrap gap-1">
            <span
              className={clsx(
                "chip !py-1 text-[8px]",
                signals.species ? "bg-mint" : "bg-white",
              )}
            >
              {signals.species ? "Species matched" : "Species inferred"}
            </span>
            <span className="chip !py-1 text-[8px]">
              {signals.colors} color{signals.colors === 1 ? "" : "s"}
            </span>
            <span
              className={clsx(
                "chip !py-1 text-[8px]",
                signals.vibe ? "bg-lilac" : "bg-white",
              )}
            >
              {signals.vibe ? "Vibe detected" : "Vibe inferred"}
            </span>
            {signals.accessories > 0 && (
              <span className="chip !py-1 text-[8px] bg-butter">
                {signals.accessories} accessor
                {signals.accessories === 1 ? "y" : "ies"}
              </span>
            )}
            {signals.occupation && (
              <span className="chip !py-1 text-[8px] bg-white">
                {signals.occupation}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-ink/50">
            Same sentence, same mascot. Every time. No image credits, no render
            queue.
          </p>
        </div>
      )}
    </section>
  );
}

export default BriefPanel;
