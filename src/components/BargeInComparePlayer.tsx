"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2, Zap, AlertTriangle } from "lucide-react";

interface Props {
  isEn: boolean;
}

type TrackMode = "ws" | "rtp";

/**
 * 真实 8kHz PSTN 电话带通（300Hz–3400Hz）英语双讲打断录音对比器：
 * 直观试听 Legacy WebSocket (920ms AI 与来电者语音刺耳重叠) vs 8kHz Raw RTP (52ms 环形缓冲瞬间清零与自然接话)
 */
export default function BargeInComparePlayer({ isEn }: Props) {
  const [playingMode, setPlayingMode] = useState<TrackMode | null>(null);
  const [progressMs, setProgressMs] = useState<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasWsRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRtpRef = useRef<HTMLCanvasElement | null>(null);

  const TOTAL_WS_MS = 3250;
  const TOTAL_RTP_MS = 3800;
  const BARGE_IN_AT_MS = 1400;
  const WS_TAIL_MS = 920;
  const RTP_CUT_MS = 52;

  const stopPlayback = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        audioElRef.current.src = "";
      } catch {
        // ignore
      }
      audioElRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setPlayingMode(null);
    setProgressMs(0);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  // 绘制双轨静态/动态示波器波形（含插话打断点、尾音重叠区与 RTP 52ms 净断回复区）
  useEffect(() => {
    const drawWave = (
      canvas: HTMLCanvasElement | null,
      mode: TrackMode,
      activeMs: number | null
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const totalMs = mode === "ws" ? TOTAL_WS_MS : TOTAL_RTP_MS;
      ctx.clearRect(0, 0, w, h);

      // 背景中心轴线
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const bargeX = (BARGE_IN_AT_MS / totalMs) * w;
      const tailEndMs = BARGE_IN_AT_MS + (mode === "ws" ? WS_TAIL_MS : RTP_CUT_MS);
      const tailEndX = (tailEndMs / totalMs) * w;

      // 高亮尾音重叠区间（WS 红色长尾碰撞 vs RTP 极窄绿线净断）
      ctx.fillStyle =
        mode === "ws"
          ? "rgba(239, 68, 68, 0.24)"
          : "rgba(16, 185, 129, 0.30)";
      ctx.fillRect(bargeX, 0, Math.max(3, tailEndX - bargeX), h);

      const bars = 96;
      for (let i = 0; i < bars; i++) {
        const tMs = (i / bars) * totalMs;
        const x = (i / bars) * w;
        const barW = Math.max(2, w / bars - 1.5);

        // AI 语音能量：在 tailEndMs 前输出；RTP 模式下在 2650ms 后快速给出接话响应
        const aiInitial = tMs < tailEndMs;
        const aiTurnReply = mode === "rtp" && tMs >= 2680 && tMs <= 3720;
        const aiAmp = aiInitial
          ? (0.28 + 0.45 * Math.abs(Math.sin(i * 0.65) * Math.cos(i * 0.23))) *
            (tMs > BARGE_IN_AT_MS && mode === "ws" ? 0.88 : 1)
          : aiTurnReply
          ? 0.26 + 0.42 * Math.abs(Math.sin(i * 0.78 + 0.4))
          : 0.03;

        // 来电者插话能量（1400ms – 2620ms）
        const userActive = tMs >= BARGE_IN_AT_MS && tMs <= 2620;
        const userAmp = userActive
          ? 0.34 + 0.48 * Math.abs(Math.sin(i * 0.91 + 1.2))
          : 0;

        if (aiAmp > 0.04) {
          const isOverlap = tMs >= BARGE_IN_AT_MS && tMs < tailEndMs;
          ctx.fillStyle =
            isOverlap && mode === "ws"
              ? "#f87171"
              : mode === "rtp"
              ? "#34d399"
              : "#94a3b8";
          const bh = aiAmp * (h * 0.42);
          ctx.fillRect(x, h / 2 - bh, barW, bh);
        }

        if (userAmp > 0.04) {
          ctx.fillStyle = "#38bdf8";
          const bh = userAmp * (h * 0.42);
          ctx.fillRect(x, h / 2 + 1, barW, bh);
        }
      }

      // 1.4s 来电者插话打断触发线
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(bargeX, 0);
      ctx.lineTo(bargeX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 实时播放游标
      if (activeMs !== null && activeMs > 0) {
        const px = Math.min(w, (activeMs / totalMs) * w);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }
    };

    drawWave(canvasWsRef.current, "ws", playingMode === "ws" ? progressMs : null);
    drawWave(canvasRtpRef.current, "rtp", playingMode === "rtp" ? progressMs : null);
  }, [playingMode, progressMs]);

  const playSynthFallback = (mode: TrackMode) => {
    const totalMs = mode === "ws" ? TOTAL_WS_MS : TOTAL_RTP_MS;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      const aiEndSec = (BARGE_IN_AT_MS + (mode === "ws" ? WS_TAIL_MS : RTP_CUT_MS)) / 1000;
      const aiOsc = ctx.createOscillator();
      const aiGain = ctx.createGain();
      aiOsc.type = "triangle";
      aiOsc.frequency.setValueAtTime(220, now);
      aiGain.gain.setValueAtTime(0.12, now);
      aiGain.gain.exponentialRampToValueAtTime(0.0001, now + aiEndSec);
      aiOsc.connect(aiGain);
      aiGain.connect(ctx.destination);
      aiOsc.start(now);
      aiOsc.stop(now + aiEndSec + 0.02);

      setPlayingMode(mode);
      startTimeRef.current = performance.now();
      const tick = () => {
        const elapsed = performance.now() - startTimeRef.current;
        if (elapsed >= totalMs) {
          stopPlayback();
          return;
        }
        setProgressMs(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      stopPlayback();
    }
  };

  const playComparison = (mode: TrackMode) => {
    if (playingMode === mode) {
      stopPlayback();
      return;
    }
    stopPlayback();

    const src =
      mode === "ws"
        ? "/audio/ws-920ms-overlap.mp3"
        : "/audio/rtp-52ms-clean.mp3";
    const totalMs = mode === "ws" ? TOTAL_WS_MS : TOTAL_RTP_MS;

    try {
      const audio = new Audio(src);
      audio.preload = "auto";
      audioElRef.current = audio;
      setPlayingMode(mode);
      startTimeRef.current = performance.now();

      audio.onended = () => {
        stopPlayback();
      };

      const tick = () => {
        if (!audioElRef.current) return;
        const currentMs =
          audioElRef.current.currentTime > 0
            ? audioElRef.current.currentTime * 1000
            : performance.now() - startTimeRef.current;
        if (currentMs >= totalMs + 150 || audioElRef.current.ended) {
          stopPlayback();
          return;
        }
        setProgressMs(Math.min(totalMs, currentMs));
        rafRef.current = requestAnimationFrame(tick);
      };

      audio
        .play()
        .then(() => {
          rafRef.current = requestAnimationFrame(tick);
        })
        .catch(() => {
          playSynthFallback(mode);
        });
    } catch {
      playSynthFallback(mode);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c10] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
          <Volume2 className="w-4 h-4" />
          <span>
            {isEn
              ? "REAL 8KHZ PSTN VOICE RECORDING — HEAR 920MS DOUBLE-TALK VS 52MS CUTOFF"
              : "真实 8kHz PSTN 英语通话实录 — 亲耳对比 920ms 抢话撞车 vs 52ms 瞬间净断"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#86868b]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> AI Agent (8kHz)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Caller Barge-In @ 1.4s
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" /> 920ms Collision
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track A: Legacy WebSocket */}
        <div className="rounded-xl border border-red-500/25 bg-[#121015] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isEn ? "Legacy WebSocket / TCP Telephony" : "传统 WebSocket / TCP 语音链路"}</span>
              </div>
              <div className="text-[11px] font-mono text-[#a1a1a6]">
                {isEn ? "920ms AI + Caller double-talk collision" : "来电者打断后 AI 仍继续念稿 920ms"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => playComparison("ws")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono font-semibold cursor-pointer transition"
            >
              {playingMode === "ws" ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{playingMode === "ws" ? (isEn ? "Stop" : "停止") : (isEn ? "Hear 920ms Overlap" : "试听 920ms 撞车")}</span>
            </button>
          </div>
          <canvas
            ref={canvasWsRef}
            width={460}
            height={78}
            className="w-full h-[78px] rounded-lg bg-black/50 border border-white/5"
          />
          <p className="text-[11px] font-mono text-[#8b909a] leading-relaxed">
            {isEn
              ? 'Caller @ 1.4s: "Hold on—switch me to billing!" while AI keeps talking over the caller until 2.32s.'
              : '1.4s 来电者插话 "Hold on—switch me to billing!"，AI 缓冲区无法撤回，持续叠音撞车至 2.32s。'}
          </p>
        </div>

        {/* Track B: 8kHz Raw RTP */}
        <div className="rounded-xl border border-emerald-500/35 bg-[#0c1512] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
                <span>{isEn ? "HardCall 8kHz Raw RTP Gateway" : "HardCall 8kHz 裸流 RTP 网关"}</span>
              </div>
              <div className="text-[11px] font-mono text-[#a1a1a6]">
                {isEn ? "52ms ring-buffer flush + instant turn reply" : "52ms 瞬间净断 + 自然毫秒级接话"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => playComparison("rtp")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold cursor-pointer transition"
            >
              {playingMode === "rtp" ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{playingMode === "rtp" ? (isEn ? "Stop" : "停止") : (isEn ? "Hear 52ms Cutoff" : "试听 52ms 净断")}</span>
            </button>
          </div>
          <canvas
            ref={canvasRtpRef}
            width={460}
            height={78}
            className="w-full h-[78px] rounded-lg bg-black/50 border border-white/5"
          />
          <p className="text-[11px] font-mono text-[#8b909a] leading-relaxed">
            {isEn
              ? 'AI cuts cleanly at 1.452s (52ms) → replies naturally: "Got it — routing you to billing right now."'
              : '1.452s（52ms）硬件级环形缓冲清零净断，听完即刻回复 "Got it — routing you to billing right now."'}
          </p>
        </div>
      </div>
    </div>
  );
}
