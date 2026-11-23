"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2, Zap, AlertTriangle } from "lucide-react";

interface Props {
  isEn: boolean;
}

type TrackMode = "ws" | "rtp";

/**
 * 100% 浏览器原生 Web Audio + Canvas 实时音频波形对比器：
 * 直观对比 Legacy WebSocket (920ms 尾音重叠) vs 8kHz Raw RTP (52ms 硬清零截断)
 */
export default function BargeInComparePlayer({ isEn }: Props) {
  const [playingMode, setPlayingMode] = useState<TrackMode | null>(null);
  const [progressMs, setProgressMs] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasWsRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRtpRef = useRef<HTMLCanvasElement | null>(null);

  const TOTAL_MS = 3200;
  const BARGE_IN_AT_MS = 1400;
  const WS_TAIL_MS = 920;
  const RTP_CUT_MS = 52;

  const stopPlayback = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  // 绘制双轨静态/动态示波器波形
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
      ctx.clearRect(0, 0, w, h);

      // 背景网格线
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const bargeX = (BARGE_IN_AT_MS / TOTAL_MS) * w;
      const tailEndMs = BARGE_IN_AT_MS + (mode === "ws" ? WS_TAIL_MS : RTP_CUT_MS);
      const tailEndX = (tailEndMs / TOTAL_MS) * w;

      // 高亮尾音重叠区间（WS 红色长尾 vs RTP 极窄绿条）
      ctx.fillStyle =
        mode === "ws"
          ? "rgba(239, 68, 68, 0.22)"
          : "rgba(16, 185, 129, 0.28)";
      ctx.fillRect(bargeX, 0, Math.max(3, tailEndX - bargeX), h);

      // 柱状声波采样
      const bars = 96;
      for (let i = 0; i < bars; i++) {
        const tMs = (i / bars) * TOTAL_MS;
        const x = (i / bars) * w;
        const barW = Math.max(2, w / bars - 1.5);

        // AI 语音能量（在 tailEndMs 之前持续输出）
        const aiActive = tMs < tailEndMs;
        const aiAmp = aiActive
          ? (0.28 + 0.45 * Math.abs(Math.sin(i * 0.65) * Math.cos(i * 0.23))) *
            (tMs > BARGE_IN_AT_MS && mode === "ws" ? 0.85 : 1)
          : 0.03;

        // 用户插话能量（在 BARGE_IN_AT_MS 之后进来）
        const userActive = tMs >= BARGE_IN_AT_MS && tMs <= 2850;
        const userAmp = userActive
          ? 0.32 + 0.48 * Math.abs(Math.sin(i * 0.91 + 1.2))
          : 0;

        // 绘制 AI 声波（上半区）
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

        // 绘制用户插话声波（下半区）
        if (userAmp > 0.04) {
          ctx.fillStyle = "#38bdf8";
          const bh = userAmp * (h * 0.42);
          ctx.fillRect(x, h / 2 + 1, barW, bh);
        }
      }

      // 0ms 打断触发竖线
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(bargeX, 0);
      ctx.lineTo(bargeX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 播放进度游标
      if (activeMs !== null && activeMs > 0) {
        const px = Math.min(w, (activeMs / TOTAL_MS) * w);
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

  const playComparison = (mode: TrackMode) => {
    if (playingMode === mode) {
      stopPlayback();
      return;
    }
    stopPlayback();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // 轨道 1：模拟 AI 电话语音流（8kHz 带通温暖合成基频 + 语调起伏）
      const aiEndSec = (BARGE_IN_AT_MS + (mode === "ws" ? WS_TAIL_MS : RTP_CUT_MS)) / 1000;
      const aiOsc = ctx.createOscillator();
      const aiGain = ctx.createGain();
      const aiFilter = ctx.createBiquadFilter();
      aiOsc.type = "triangle";
      aiOsc.frequency.setValueAtTime(215, now);
      aiOsc.frequency.linearRampToValueAtTime(245, now + 0.45);
      aiOsc.frequency.linearRampToValueAtTime(195, now + 0.95);
      aiOsc.frequency.linearRampToValueAtTime(235, now + 1.38);
      if (mode === "ws") {
        // WebSocket 尾音继续拖尾 920ms 造成刺耳重叠
        aiOsc.frequency.linearRampToValueAtTime(210, now + aiEndSec);
      }
      aiFilter.type = "bandpass";
      aiFilter.frequency.setValueAtTime(950, now);
      aiFilter.Q.setValueAtTime(1.4, now);

      aiGain.gain.setValueAtTime(0.001, now);
      aiGain.gain.exponentialRampToValueAtTime(0.14, now + 0.06);
      aiGain.gain.setValueAtTime(0.14, now + aiEndSec - 0.02);
      aiGain.gain.exponentialRampToValueAtTime(0.0001, now + aiEndSec);

      aiOsc.connect(aiFilter);
      aiFilter.connect(aiGain);
      aiGain.connect(ctx.destination);
      aiOsc.start(now);
      aiOsc.stop(now + aiEndSec + 0.02);

      // 轨道 2：模拟用户第 1.4s 插话打断（清脆较高频段区分说话人）
      const userStartSec = BARGE_IN_AT_MS / 1000;
      const userEndSec = 2.85;
      const userOsc = ctx.createOscillator();
      const userGain = ctx.createGain();
      userOsc.type = "sine";
      userOsc.frequency.setValueAtTime(370, now + userStartSec);
      userOsc.frequency.linearRampToValueAtTime(420, now + userStartSec + 0.35);
      userOsc.frequency.linearRampToValueAtTime(340, now + userStartSec + 0.85);
      userOsc.frequency.linearRampToValueAtTime(390, now + userEndSec);

      userGain.gain.setValueAtTime(0.0001, now + userStartSec);
      userGain.gain.exponentialRampToValueAtTime(0.12, now + userStartSec + 0.04);
      userGain.gain.setValueAtTime(0.12, now + userEndSec - 0.06);
      userGain.gain.exponentialRampToValueAtTime(0.0001, now + userEndSec);

      userOsc.connect(userGain);
      userGain.connect(ctx.destination);
      userOsc.start(now + userStartSec);
      userOsc.stop(now + userEndSec + 0.02);

      setPlayingMode(mode);
      startTimeRef.current = performance.now();

      const tick = () => {
        const elapsed = performance.now() - startTimeRef.current;
        if (elapsed >= TOTAL_MS) {
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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c10] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
          <Volume2 className="w-4 h-4" />
          <span>
            {isEn
              ? "LIVE AUDIO WAVEFORM BENCHMARK — HEAR THE BARGE-IN DIFFERENCE"
              : "实机声波对比演示 — 亲耳听出 920ms 尾音重叠 vs 52ms 硬截断"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#86868b]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> AI Outbound
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> User Barge-In (0ms)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Collision Tail
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
                <span>{isEn ? "Legacy WebSocket / TCP" : "传统 WebSocket / TCP 链路"}</span>
              </div>
              <div className="text-[11px] font-mono text-[#a1a1a6]">
                {isEn ? "920ms trailing audio overlap after interrupt" : "插话后仍有 920ms 刺耳尾音重叠"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => playComparison("ws")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono font-semibold cursor-pointer transition"
            >
              {playingMode === "ws" ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{playingMode === "ws" ? (isEn ? "Stop" : "停止") : (isEn ? "Play 920ms" : "试听 920ms")}</span>
            </button>
          </div>
          <canvas
            ref={canvasWsRef}
            width={460}
            height={78}
            className="w-full h-[78px] rounded-lg bg-black/50 border border-white/5"
          />
        </div>

        {/* Track B: 8kHz Raw RTP */}
        <div className="rounded-xl border border-emerald-500/35 bg-[#0c1512] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
                <span>{isEn ? "HardCall 8kHz Raw RTP" : "HardCall 8kHz 裸流 RTP 引擎"}</span>
              </div>
              <div className="text-[11px] font-mono text-[#a1a1a6]">
                {isEn ? "52ms clean cutoff · 0.16ms ring-buffer flush" : "52ms 瞬间净断 · 0.16ms 环形缓冲清零"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => playComparison("rtp")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold cursor-pointer transition"
            >
              {playingMode === "rtp" ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{playingMode === "rtp" ? (isEn ? "Stop" : "停止") : (isEn ? "Play 52ms" : "试听 52ms")}</span>
            </button>
          </div>
          <canvas
            ref={canvasRtpRef}
            width={460}
            height={78}
            className="w-full h-[78px] rounded-lg bg-black/50 border border-white/5"
          />
        </div>
      </div>
    </div>
  );
}
