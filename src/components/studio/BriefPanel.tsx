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
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const promptRef = useRef(prompt);

  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    queueMicrotask(() => setVoiceSupported(Boolean(Ctor)));
  }, []);

  const startVoice = () => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechConstructor;
      webkitSpeechRecognition?: SpeechConstructor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceNote("Voice input isn't supported in this browser. Type below!");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalText = "";

    rec.onresult = (event: SpeechEvent) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalText += `${item[0].transcript} `;
        } else {
          currentInterim += item[0].transcript;
        }
      }
      setInterim(currentInterim);
      if (finalText) {
        setPrompt(finalText.trim());
      }
    };

    rec.onerror = (event: { error?: string }) => {
      setListening(false);
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
      className="rounded-[17px] border border-[#d7d4cb] bg-[#fefdf9] p-4 shadow-sm"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d7d4cb] bg-[#efece4] font-mono text-[10px] font-bold text-[#111111]">
            01
          </span>
          <h2 id="brief-heading" className="font-display text-lg font-extrabold text-[#111111]">
            The brief
          </h2>
        </div>
        <span className="mono-label text-[10px]">one sentence</span>
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
        className="field resize-none !text-[14px] leading-relaxed"
      />
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={startVoice}
          className={clsx(
            "chip !py-1 min-h-[30px] transition-colors",
            listening ? "bg-[#ff5a45] text-white border-[#ff5a45]" : "bg-[#fefdf9]",
          )}
          aria-pressed={listening}
          title={
            voiceSupported === false
              ? "Voice input isn't supported in this browser"
              : "Dictate the brief"
          }
        >
          {listening ? (
            <MicOff size={13} strokeWidth={2.4} />
          ) : (
            <Mic size={13} strokeWidth={2.4} />
          )}
          {listening ? "Listening…" : "Voice"}
          {voiceSupported === false && (
            <span className="text-[8px] opacity-60">n/a</span>
          )}
        </button>
        <span className="font-mono text-[10px] text-[#6f6759]">
          {prompt.length}/220 · ⌘↵
        </span>
      </div>

      {listening && (
        <div className="mt-2 rounded-[13px] border border-dashed border-[#ff5a45] bg-[#ff5a45]/10 px-3 py-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ff5a45] font-semibold">
            Recording
          </p>
          <p className="mt-1 min-h-[18px] text-[12px] italic text-[#2c2823]">
            {interim || "Say the brief…"}
          </p>
        </div>
      )}

      {voiceNote && (
        <p className="mt-2 rounded-[13px] border border-[#d7d4cb] bg-[#efece4]/60 px-3 py-2 text-[12px] leading-snug text-[#2c2823]">
          {voiceNote}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onGenerate()}
          disabled={disabled}
          className="btn btn-primary flex-1 !min-h-[42px] disabled:opacity-50"
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
          className="btn !min-h-[42px] !px-3 disabled:opacity-50"
          title="Generate a surprise mascot"
        >
          <Shuffle size={14} />
          <span className="hidden sm:inline">Surprise</span>
        </button>
      </div>

      <div className="mt-3.5">
        <p className="mono-label mb-1.5 text-[10px]">Or start from one of these</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.slice(0, 3).map((sample, i) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setPrompt(sample);
                onGenerate(sample);
              }}
              className="chip !py-1 text-[10px] min-h-[28px]"
            >
              <Sparkles size={10} className="text-[#4b63ff]" />
              {["Sunny cat", "Dev fox", "Sleepy blob"][i]}
            </button>
          ))}
        </div>
      </div>

      {signals && (
        <div className="mt-3.5 rounded-[13px] border border-dashed border-[#d7d4cb] bg-[#efece4]/50 p-3">
          <p className="mono-label mb-1.5 text-[10px]">Compiler signals</p>
          <div className="flex flex-wrap gap-1">
            <span
              className={clsx(
                "chip !py-0.5 text-[9px] min-h-[24px]",
                signals.species ? "bg-[#6fd6a8] text-[#111111] border-[#6fd6a8]" : "bg-[#fefdf9]",
              )}
            >
              {signals.species ? "Species matched" : "Species inferred"}
            </span>
            <span className="chip !py-0.5 text-[9px] min-h-[24px]">
              {signals.colors} color{signals.colors === 1 ? "" : "s"}
            </span>
            <span
              className={clsx(
                "chip !py-0.5 text-[9px] min-h-[24px]",
                signals.vibe ? "bg-[#c9b6ff] text-[#111111] border-[#c9b6ff]" : "bg-[#fefdf9]",
              )}
            >
              {signals.vibe ? "Vibe detected" : "Vibe inferred"}
            </span>
            {signals.accessories > 0 && (
              <span className="chip !py-0.5 text-[9px] min-h-[24px] bg-[#ffc53d] text-[#111111] border-[#ffc53d]">
                {signals.accessories} accessor
                {signals.accessories === 1 ? "y" : "ies"}
              </span>
            )}
            {signals.occupation && (
              <span className="chip !py-0.5 text-[9px] min-h-[24px] bg-[#fefdf9]">
                {signals.occupation}
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[#6f6759]">
            Deterministic rig: same sentence, same mascot. No runtime credits or latency.
          </p>
        </div>
      )}
    </section>
  );
}

export default BriefPanel;
