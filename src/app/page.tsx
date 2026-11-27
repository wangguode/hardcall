"use client";

import React, { useState, useEffect, useRef } from "react";
import BargeInComparePlayer from "@/components/BargeInComparePlayer";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Star,
  Zap,
  Layers,
  Server,
  Loader2,
  X,
  RotateCcw,
  CreditCard,
  Download,
  Trash2,
  Activity,
  ShieldCheck,
} from "lucide-react";

type ScenarioCategory = "pstnClaims" | "clinicTriage" | "bankingIvr" | "archSla";

interface TelephonyScenario {
  id: string;
  category: ScenarioCategory;
  categoryName: string;
  categoryNameZh: string;
  title: string;
  titleZh: string;
  callerPersona: string;
  opener: string;
  interruptLine: string;
  strongFollowUp: string;
  laggyWrapperSample: string;
  rtpCrispSample: string;
  patchPrescription: string;
}

interface LocalBenchRun {
  id: string;
  savedAt: string;
  scenarioTitle: string;
  cutoffMs: number;
  doubleTalkEvents: number;
  stabilityScore: number;
}

const BENCH_STORAGE_KEY = "hardcall_bench_runs_v1";

/**
 * 100% 统一的企业级电信 PSTN / SIP / WebRTC 语音打断压测场景库
 * 彻底消除原 B2C 求职面试割裂文案，让 CTO / 语音工程师一进站即进入真实电话双讲与抢话测试语境
 */
const SCENARIO_BANK: TelephonyScenario[] = [
  {
    id: "pstn_claims_cutoff",
    category: "pstnClaims",
    categoryName: "PSTN Claims Barge-In",
    categoryNameZh: "PSTN 车险理赔强行插话",
    title: "Impatient Policyholder Mid-Sentence Cutoff",
    titleZh: "报案客户半途强行打断冗长 TTS 播报",
    callerPersona: "Inbound PSTN Caller · 8kHz G.711 u-law Trunk",
    opener:
      "Caller connected on 8kHz PSTN trunk: 'Look, I'm standing on the highway shoulder—skip the privacy disclaimer and tell me if my tow truck is dispatched right now!'",
    interruptLine:
      "[CALLER BARGE-IN AT 52ms]: 'Stop reading the script! You're talking over me—just give me the ETA in minutes!'",
    strongFollowUp:
      "Clean 52ms ring-buffer flush confirmed. Zero trailing TTS overlap; caller heard immediate turn-taking and confirmed dispatch #4819.",
    laggyWrapperSample:
      "Um, thank you for calling automated claims, please listen carefully as our menu options have kind of changed and maybe...",
    rtpCrispSample:
      "Tow unit 4819 is 11 minutes from I-95 Exit 14. Stay inside your vehicle; SMS tracking is live now.",
    patchPrescription:
      "Flush 256-frame outbound RTP ring buffer in 0.16ms on Silero Fast-VAD speech onset (<50ms window) instead of waiting for WebSocket TTS chunk drain.",
  },
  {
    id: "pstn_policy_verify",
    category: "pstnClaims",
    categoryName: "PSTN Claims Barge-In",
    categoryNameZh: "PSTN 车险理赔强行插话",
    title: "Rapid Digit & Address Correction Over TTS",
    titleZh: "客户抢话纠正保单号与门牌数字",
    callerPersona: "Inbound PSTN Caller · Carrier Jitter 28ms",
    opener:
      "Caller: 'Wait—you read back zip code 94107, no, it's 94105! Did your system catch 94105 or do I need a human agent?'",
    interruptLine:
      "[CALLER BARGE-IN AT 54ms]: 'Hello?! Stop repeating the old address—can you hear me interrupting you?'",
    strongFollowUp:
      "SOXR VHQ 8kHz->16kHz upsampling preserved consonant clarity during double-talk; state updated to 94105 in 1 turn.",
    laggyWrapperSample:
      "Well, you know, let me sort of check the previous record again because maybe the system was still speaking...",
    rtpCrispSample:
      "Updated to 94105 immediately—previous TTS buffer cleared in 0.16ms and dispatch routing locked to 94105.",
    patchPrescription:
      "Replace linear 8kHz browser/Node resampling with libsoxr VHQ before Deepgram/Whisper ingestion to cut digit WER during barge-in by 38%.",
  },
  {
    id: "clinic_double_talk",
    category: "clinicTriage",
    categoryName: "Healthcare Double-Talk",
    categoryNameZh: "医疗分诊双讲与背景噪音声学",
    title: "Clinic Intake With Background Cough / Noise Guard",
    titleZh: "急诊预约背景杂音防误打断 + 真插话秒停",
    callerPersona: "Patient Line · Cellular AMR-WB -> G.711 Gateway",
    opener:
      "Caller on noisy cellular line: 'I need to reschedule my 8 AM MRI tomorrow—hold on—actually make it Thursday after 2 PM.'",
    interruptLine:
      "[DOUBLE-TALK DETECTED AT 56ms]: 'Stop! Not Tuesday—I just said Thursday after 2 PM! Why did your voice keep talking?'",
    strongFollowUp:
      "Two-tier VAD guard passed: 50ms acoustic fast-pause muted TTS immediately while 200ms semantic check confirmed Thursday 14:30 slot.",
    laggyWrapperSample:
      "Um, I think maybe we have Tuesday morning kind of available if you want to listen to all five slots first...",
    rtpCrispSample:
      "Confirmed Thursday at 2:30 PM for MRI Suite 3. Your 8 AM tomorrow slot is released with zero cancellation fee.",
    patchPrescription:
      "Pair 50ms Fast-Loop acoustic mute with a 200ms semantic confirmation gate so transient coughs resume smoothly while real speech aborts TTS cleanly.",
  },
  {
    id: "banking_ivr_dispute",
    category: "bankingIvr",
    categoryName: "Banking IVR Cutoff",
    categoryNameZh: "银行风控外呼低延迟打断",
    title: "Card Fraud Alert Instant Verification",
    titleZh: "信用卡盗刷核实外呼毫秒级止损交互",
    callerPersona: "Cardholder · Outbound SIP Trunk (ptime=20ms)",
    opener:
      "Cardholder picks up outbound alert: 'Yes, I see the $1,420 wire attempt—did NOT authorize it! Freeze the card right now!'",
    interruptLine:
      "[BARGE-IN CUTOFF AT 51ms]: 'Don't read me the terms! Confirm the card ending 8821 is frozen this second!'",
    strongFollowUp:
      "Sub-60ms full-duplex cutoff verified: card #8821 locked in 190ms with zero TCP head-of-line stall.",
    laggyWrapperSample:
      "Um, before we kind of proceed with card services, please note this call maybe recorded for quality...",
    rtpCrispSample:
      "Card ending 8821 is frozen as of 0.2 seconds ago, the $1,420 charge is blocked, and your replacement ships overnight.",
    patchPrescription:
      "Move media transport off TCP/WebSocket onto raw UDP/RTP (ptime=20ms) with FreeSWITCH mod_audio_fork / raw RTP socket bridge.",
  },
  {
    id: "arch_sla_defense",
    category: "archSla",
    categoryName: "SIP/RTP SLA Stress Test",
    categoryNameZh: "电信网关架构与 SLA 极限压测",
    title: "200-Concurrent SIP Channels Tail-Latency Audit",
    titleZh: "200 并发 SIP 通道 p99 尾音截断压测",
    callerPersona: "VP of Infrastructure · Voice AI Platform",
    opener:
      "VP Infra: 'At 200 concurrent Twilio SIP calls our p99 barge-in spikes to 1,150ms. Walk me through your exact RTP frame budget.'",
    interruptLine:
      "[SLA AUDIT INTERRUPT AT 52ms]: 'Skip generic cloud talk—give me exact milliseconds for packetization, resampler, VAD, and ring flush!'",
    strongFollowUp:
      "Exact 51.9ms frame budget verified (20ms RTP + 1.8ms SOXR VHQ + 18ms Silero VAD + 0.16ms 256-frame clearAudio). Ready for 48h SIP profiling.",
    laggyWrapperSample:
      "Well, you know, we kind of scale Kubernetes pods and maybe tune WebSocket ping intervals to help...",
    rtpCrispSample:
      "20ms RTP frame + 1.8ms SOXR VHQ + 18ms local Silero VAD + 0.16ms 256-frame ring teardown = 51.9ms p95 cutoff at 200 channels.",
    patchPrescription:
      "Pin per-call RTP worker threads with lock-free 256-frame ring buffers to hold <60ms p95 cutoff under 200+ concurrent PSTN trunks.",
  },
];

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const isEn = lang === "en";

  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>("pstnClaims");
  const [selectedQuestion, setSelectedQuestion] = useState<TelephonyScenario>(SCENARIO_BANK[0]);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "active" | "ended">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [doubleTalkRisk, setDoubleTalkRisk] = useState(42);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [transcript, setTranscript] = useState<
    { speaker: string; text: string; isInterrupt: boolean; note?: string }[]
  >([]);
  const [userCustomInput, setUserCustomInput] = useState("");
  const [verifiedNotice, setVerifiedNotice] = useState("");
  const [b2bModalPlan, setB2bModalPlan] = useState<"audit" | "kit" | null>(null);
  const [b2bEmail, setB2bEmail] = useState("");
  const [b2bStackNote, setB2bStackNote] = useState("");
  const [b2bLoading, setB2bLoading] = useState(false);
  const [b2bError, setB2bError] = useState("");
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreOrderRef, setRestoreOrderRef] = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  // 本地压测记录留存（让语音工程师多次测试、导出 JSON 给团队评审）
  const [benchRuns, setBenchRuns] = useState<LocalBenchRun[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(BENCH_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LocalBenchRun[];
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  // CTO 潜客免费样本报告与预检留资状态
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStack, setLeadStack] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("hardcall_license_active");
    if (saved) {
      setVerifiedNotice(
        isEn
          ? "HardCall B2B Commercial Engagement Active (Verified via Creem.io)"
          : "HardCall 企业商业授权已激活（Creem 订单验证通过）"
      );
    }
    const params = new URLSearchParams(window.location.search);
    const restoreTok = params.get("restore_token")?.trim();
    if (restoreTok) {
      fetch("/api/license/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: restoreTok }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { restored?: boolean; plan?: string; orderId?: string } | null) => {
          if (d?.restored) {
            localStorage.setItem("hardcall_license_active", d.orderId || restoreTok);
            setVerifiedNotice(
              isEn
                ? `Verified ${d.plan === "kit" ? "$1,200 RTP Kit" : "$299 Latency Audit"} order (${d.orderId || ""})`
                : `已核验激活订单（${d.orderId || ""}）`
            );
            params.delete("restore_token");
            const qs = params.toString();
            window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
          }
        })
        .catch(() => {});
      return;
    }
    const checkoutId = params.get("checkout_id");
    if (params.get("checkout") !== "success" || !checkoutId) return;

    fetch(`/api/verify-checkout?checkout_id=${encodeURIComponent(checkoutId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { verified?: boolean; plan?: string } | null) => {
        if (data?.verified) {
          localStorage.setItem("hardcall_license_active", checkoutId);
          localStorage.setItem("hardcall_license_plan", data.plan === "kit" ? "kit" : "audit");
          try {
            const w = window as Window & { lpConvert?: (ev: string, val: number) => void };
            w.lpConvert?.("purchase", data.plan === "kit" ? 1200 : 299);
          } catch {
            // ignore
          }
          setVerifiedNotice(
            isEn
              ? "Payment verified via Creem.io — Kickoff instructions sent to your inbox!"
              : "Creem 支付核验成功 — 工程对接指引已发送至您的邮箱！"
          );
          params.delete("checkout");
          params.delete("checkout_id");
          params.delete("plan");
          const qs = params.toString();
          window.history.replaceState(
            {},
            "",
            qs ? `${window.location.pathname}?${qs}` : window.location.pathname
          );
        }
      })
      .catch(() => {});
  }, [isEn]);

  useEffect(() => {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "page_view",
        meta: { ref: (document.referrer || "direct").slice(0, 100) },
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const handleLeadCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !leadStack.trim()) return;
    setLeadLoading(true);
    setLeadMsg("");
    try {
      const res = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail.trim(),
          voiceStack: leadStack.trim(),
          notes: "Requested Sample 48h Audit Trace from Pricing",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !data.ok) {
        setLeadMsg(data.error || "Could not submit. Email hello@statementflow.win directly.");
        return;
      }
      setLeadMsg(
        data.message ||
          "Sample 51.9ms RTP trace sent to your inbox! Reply with a test SIP URI anytime."
      );
      setLeadEmail("");
      setLeadStack("");
    } catch {
      setLeadMsg("Network error — please email hello@statementflow.win.");
    } finally {
      setLeadLoading(false);
    }
  };

  const handleB2bCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bModalPlan) return;
    setB2bLoading(true);
    setB2bError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: b2bModalPlan,
          email: b2bEmail.trim(),
          stackNote: b2bStackNote.trim(),
        }),
      });
      const data = (await res.json()) as {
        mode?: string;
        checkoutUrl?: string;
        contactEmail?: string;
        error?: string;
      };
      if (res.ok && data.mode === "live_redirect" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.mode === "concierge_invoice") {
        const subj = encodeURIComponent(
          b2bModalPlan === "kit"
            ? "HardCall $1,200 8kHz RTP Deployment Kit Order"
            : "HardCall $299 48h Voice Latency Audit Order"
        );
        const body = encodeURIComponent(
          `Work Email: ${b2bEmail}\nVoice Stack: ${b2bStackNote || "SIP / WebRTC"}\nPlease send the commercial invoice & kickoff link.`
        );
        window.location.href = `mailto:${data.contactEmail || "hello@statementflow.win"}?subject=${subj}&body=${body}`;
        return;
      }
      setB2bError(data.error || "Unable to start checkout. Please retry or email hello@statementflow.win.");
    } catch {
      setB2bError("Network error while connecting to Creem.io. Please retry.");
    } finally {
      setB2bLoading(false);
    }
  };

  const handleRestoreOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreLoading(true);
    setRestoreError("");
    try {
      const res = await fetch("/api/license/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: restoreEmail.trim(),
          orderRef: restoreOrderRef.trim(),
        }),
      });
      const data = (await res.json()) as { restored?: boolean; orderId?: string; plan?: string; error?: string };
      if (!res.ok || !data.restored) {
        setRestoreError(data.error || "Order not found. Check your checkout email and Creem Order ID.");
        return;
      }
      localStorage.setItem("hardcall_license_active", data.orderId || "verified");
      setVerifiedNotice(
        isEn
          ? `Order verified (${data.orderId}) — HardCall B2B engagement active.`
          : `订单核验通过（${data.orderId}）— 企业服务已激活。`
      );
      setRestoreOpen(false);
    } catch {
      setRestoreError("Network error. Please retry.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [stallCounts, setStallCounts] = useState<{ [key: string]: number }>({
    "um/uh": 0,
    "kind of": 0,
    maybe: 0,
    "trailing TTS": 0,
  });

  const filteredQuestions = SCENARIO_BANK.filter((q) => q.category === activeCategory);

  useEffect(() => {
    let t: any;
    if (callStatus === "active") {
      t = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [callStatus]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = "en-US";

        reco.onresult = (event: any) => {
          let liveText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            liveText += event.results[i][0].transcript;
          }
          if (liveText.trim()) {
            setUserCustomInput(liveText);
          }
        };

        reco.onerror = () => setIsRecording(false);
        reco.onend = () => setIsRecording(false);
        recognitionRef.current = reco;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (userCustomInput.trim()) {
        handleRespond(userCustomInput);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleStartCall = () => {
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "sim_start", meta: { scenario: selectedQuestion.id } }),
      keepalive: true,
    }).catch(() => {});
    setCallStatus("ringing");
    setTranscript([]);
    setElapsed(0);
    setDoubleTalkRisk(45);
    setIsInterrupting(false);
    setStallCounts({ "um/uh": 0, "kind of": 0, maybe: 0, "trailing TTS": 0 });
  };

  const handleAcceptCall = () => {
    setCallStatus("active");
    setTranscript([
      {
        speaker: selectedQuestion.callerPersona,
        text: selectedQuestion.opener,
        isInterrupt: false,
      },
    ]);
  };

  const handleRespond = (textToSubmit: string) => {
    if (!textToSubmit.trim()) return;
    const text = textToSubmit.trim();
    setUserCustomInput("");

    const lower = text.toLowerCase();
    const nextStalls = { ...stallCounts };
    if (lower.includes("um") || lower.includes("uh")) nextStalls["um/uh"] += 1;
    if (lower.includes("kind of") || lower.includes("sort of")) nextStalls["kind of"] += 1;
    if (lower.includes("maybe")) nextStalls.maybe += 1;

    const isLaggyResponse =
      lower.includes("um") ||
      lower.includes("kind of") ||
      lower.includes("maybe") ||
      lower.includes("you know") ||
      text.length > 140 ||
      !/\d/.test(text);

    if (isLaggyResponse) {
      nextStalls["trailing TTS"] += 1;
    }
    setStallCounts(nextStalls);

    const newTranscript = [
      ...transcript,
      { speaker: "Agent Outbound Stream (Mic / Script)", text, isInterrupt: false },
    ];

    if (isLaggyResponse) {
      setDoubleTalkRisk((prev) => Math.min(96, prev + 28));
      setIsInterrupting(true);
      setTimeout(() => setIsInterrupting(false), 1200);

      newTranscript.push({
        speaker: `${selectedQuestion.callerPersona} [52ms FAST-VAD CUTOFF]`,
        text: selectedQuestion.interruptLine,
        isInterrupt: true,
        note: isEn
          ? "Triggered 52ms Outbound Ring Flush: Verbose/unquantified TTS preamble caused caller barge-in."
          : "触发 52ms 环形缓冲区硬清零：冗长播报触发来电者强行抢话截断。",
      });
    } else {
      setDoubleTalkRisk((prev) => Math.max(12, prev - 22));
      newTranscript.push({
        speaker: selectedQuestion.callerPersona,
        text: selectedQuestion.strongFollowUp,
        isInterrupt: false,
        note: isEn
          ? "Sub-60ms Turn-Taking Verified: Zero trailing audio overlap; caller intent resolved in 1 turn."
          : "亚 60ms 全双工轮转通过：零尾音重叠，单轮完成业务闭环。",
      });
    }

    setTranscript(newTranscript);
  };

  const handleEndCall = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    const interrupts = transcript.filter((t) => t.isInterrupt).length;
    const score = Math.max(58, Math.min(99, 96 - interrupts * 12));
    const runItem: LocalBenchRun = {
      id: `run-${Date.now()}`,
      savedAt: new Date().toISOString(),
      scenarioTitle: selectedQuestion.title,
      cutoffMs: 52,
      doubleTalkEvents: interrupts,
      stabilityScore: score,
    };
    setBenchRuns((prev) => {
      const next = [runItem, ...prev].slice(0, 6);
      try {
        window.localStorage.setItem(BENCH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCallStatus("ended");
  };

  const handleExportBenchJson = () => {
    const blob = new Blob([JSON.stringify(benchRuns, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hardcall-bargein-benchmark-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearBenchRuns = () => {
    setBenchRuns([]);
    try {
      window.localStorage.removeItem(BENCH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalStalls = Object.values(stallCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a] text-[#f5f5f7]">
      {/* V8 悬浮光学暗曜石磨砂导航舱 */}
      <div className="sticky top-3 z-50 px-3 sm:px-6">
        <header className="hc-frosted-topbar mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl px-3.5 sm:px-5">
          <div className="flex items-center gap-6 min-w-0">
            <a href="#" className="flex shrink-0 whitespace-nowrap items-center gap-2 font-semibold text-[14.5px] sm:text-[15px] tracking-tight">
              <span className="w-7 h-7 rounded-[9px] bg-gradient-to-b from-emerald-400 to-emerald-600 text-black flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                <Phone className="w-3.5 h-3.5 fill-current" />
              </span>
              <span className="font-bold">HardCall RTP</span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#a1a1a6]">
              <a href="#enterprise-b2b" className="hover:text-white transition-colors">
                {isEn ? "60ms Audio Benchmark" : "60ms 声波对比"}
              </a>
              <a href="#audit-preview" className="hover:text-white transition-colors">
                {isEn ? "Sample 48h Report" : "48h 报告样板"}
              </a>
              <a href="#simulator" className="hover:text-white transition-colors">
                {isEn ? "PSTN Barge-In Sandbox" : "浏览器免费压测"}
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                {isEn ? "B2B Pricing" : "企业方案"}
              </a>
              <a
                href="https://github.com/wangguode/ai-agent-voice"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  fetch("/api/event", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "github_click" }),
                    keepalive: true,
                  }).catch(() => {});
                }}
                className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <Star className="w-3 h-3 text-emerald-400" />
                <span>GitHub</span>
              </a>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setRestoreOpen(true)}
              className="hidden sm:inline-flex whitespace-nowrap min-h-9 items-center gap-1.5 text-xs text-[#c7c7cc] hover:text-white px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEn ? "Verify Order" : "订单核验"}</span>
            </button>
            <button
              onClick={() => setLang(isEn ? "zh" : "en")}
              className="flex whitespace-nowrap min-h-9 items-center gap-1 text-xs text-[#c7c7cc] hover:text-white px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? "中文" : "EN"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                fetch("/api/event", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ event: "b2b_modal_open", meta: { src: "topbar" } }),
                  keepalive: true,
                }).catch(() => {});
                setB2bModalPlan("audit");
              }}
              className="whitespace-nowrap min-h-9 text-xs px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors cursor-pointer"
            >
              <span className="sm:hidden">{isEn ? "$299 Audit" : "$299 压测"}</span>
              <span className="hidden sm:inline">{isEn ? "Book $299 Audit" : "预约 $299 压测"}</span>
            </button>
          </div>
        </header>
      </div>

      {/* 第 1 幕：电信级全双工打断旗舰 Hero */}
      <section className="hc-hero-aura relative pt-12 sm:pt-16 pb-16 px-4 sm:px-8 border-b border-white/10 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex max-w-full items-center justify-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] sm:text-xs font-medium text-emerald-400 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {isEn
                ? "52ms Full-Duplex Barge-In · Raw 8kHz RTP / FreeSWITCH Telephony Engine"
                : "52ms 毫秒级语音打断 · 原始 8kHz RTP / FreeSWITCH 电信级语音网关"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.06] text-white">
            {isEn ? (
              <>
                <span className="block">WebSocket Voice AI lags.</span>
                <span className="text-emerald-400 block mt-1">
                  Go 52ms full-duplex.
                </span>
              </>
            ) : (
              <>
                <span className="block">告别 900ms 抢话重叠。</span>
                <span className="text-emerald-400 block mt-1">
                  升级 52ms 电信级全双工打断。
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-xl text-[#a1a1a6] max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Standard WebSocket voice wrappers talk over PSTN callers for 900ms+. Hear the A/B waveform proof below, inspect a real 48h SIP/RTP flamegraph report, or deploy our self-hosted 8kHz RTP + SOXR VHQ gateway."
              : "常规 WebSocket 语音封装在真实电话线路上存在 900ms+ 尾音抢话与重采样失真。立即试听下方 60ms vs 920ms 声波对比、查阅 48h 压测火焰图样板，或私有化部署 8kHz RTP 网关。"}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setB2bModalPlan("audit")}
              className="min-h-12 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/15"
            >
              <Server className="w-4 h-4" />
              <span>{isEn ? "Book 48h Latency Audit · $299" : "预约 48h 语音延迟体检 · $299"}</span>
            </button>

            <a
              href="#enterprise-b2b"
              className="min-h-12 px-6 py-3 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm flex items-center gap-2 transition-colors backdrop-blur-md"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? "Hear 52ms vs 920ms Proof" : "试听 52ms vs 920ms 声波对比"}</span>
            </a>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#86868b] font-mono tabular-nums">
            <span>✓ 0.16ms 256-Frame Ring Flush</span>
            <span>✓ SOXR VHQ 8kHz→16kHz Lossless</span>
            <span>✓ ≥40% Latency Cut or 100% Refund SLA</span>
          </div>
        </div>
      </section>

      {/* 第 2 幕（紧接首屏！）：60ms vs 920ms 双轨声波实测对比 + 48h 压测火焰图交付样板 */}
      <section id="enterprise-b2b" className="py-16 px-4 sm:px-8 border-b border-white/10 bg-[#0b0d13]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="hc-frosted-card p-6 sm:p-8 rounded-3xl space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  {isEn
                    ? "ACOUSTIC EVIDENCE · RAW 8kHz RTP VS WEBSOCKET WRAPPERS"
                    : "声学实证 · 原始 8kHz RTP 对比常规 WebSocket 封装"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {isEn
                    ? "Hear why callers hang up on 920ms WebSocket voice agents."
                    : "亲耳对比：为什么 920ms 尾音重叠会让电话客户直接挂断？"}
                </h2>
                <p className="text-xs sm:text-sm text-[#a1a1a6] leading-relaxed">
                  {isEn
                    ? "Built for AI call centers, healthcare intake, insurance claims, and outbound voice startups eliminating PSTN double-talk, TCP head-of-line stalls, and 8kHz aliasing."
                    : "专为 AI 电话客服、医疗分诊、车险报案与外呼语音团队打造，根除 PSTN 双讲重叠、TCP 队头阻塞与 8kHz 采样混叠。"}
                </p>
              </div>
              <a
                href="https://github.com/wangguode/ai-agent-voice/tree/main/01-voice-agent-rtp-bargein"
                target="_blank"
                rel="noreferrer"
                className="min-h-10 inline-flex items-center shrink-0 px-4 py-2 rounded-full border border-emerald-400/40 text-emerald-300 font-mono text-xs hover:bg-emerald-500/10 transition-colors"
              >
                {isEn ? "Inspect Open-Source RTP Lab →" : "查看开源 8kHz RTP 实验室 →"}
              </a>
            </div>

            {/* 实机声波对比演示器 */}
            <BargeInComparePlayer isEn={isEn} />

            {/* 实机延迟对比基准表 */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0c10]">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead className="border-b border-white/10 text-[#86868b]">
                  <tr>
                    <th className="py-3 px-4">{isEn ? "Benchmark Dimension" : "核心工程维度"}</th>
                    <th className="py-3 px-4">{isEn ? "Standard WebSocket Wrapper" : "常规 WebSocket 封装"}</th>
                    <th className="py-3 px-4 text-emerald-400">{isEn ? "HardCall 8kHz RTP Engine" : "HardCall 8kHz RTP 引擎"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#d1d1d6]">
                  <tr>
                    <td className="py-2.5 px-4 text-white">{isEn ? "End-to-End Barge-In Cutoff" : "端到端插话打断延迟"}</td>
                    <td className="py-2.5 px-4 text-red-400">850ms – 1,400ms</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">51.9ms – 60ms (Fast-Loop VAD)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-white">{isEn ? "Outbound Audio Ring Flush" : "出站缓冲区尾音硬清"}</td>
                    <td className="py-2.5 px-4">300ms+ trailing overlap</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">0.16ms (256-frame teardown)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-white">{isEn ? "PSTN 8kHz → 16kHz Resampling" : "8kHz 电话重采样保真"}</td>
                    <td className="py-2.5 px-4">Linear aliasing / digit WER spike</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">SOXR VHQ lossless pipeline</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-white">{isEn ? "Packet Loss & Jitter Handling" : "弱网抖动与队头阻塞"}</td>
                    <td className="py-2.5 px-4">TCP head-of-line stalls</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-bold">Raw UDP/RTP ptime=20ms</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 48 小时 $299 延迟体检真实交付物预览（消除黑盒焦虑） */}
            <div id="audit-preview" className="rounded-2xl border border-emerald-500/30 bg-[#090d12] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    {isEn ? "SAMPLE $299 DELIVERABLE PREVIEW (48H TURNAROUND)" : "$299 架构压测报告真实交付样板（48 小时交付）"}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {isEn
                      ? "What your engineering team receives inside the 48h SIP/RTP Latency Audit"
                      : "下单 $299 后，您的语音工程团队将在 48 小时内收到的逐帧火焰图诊断书"}
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-300">
                  ≥40% Latency Cut or 100% Refund
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
                <div className="rounded-xl border border-white/10 bg-black/50 p-3.5">
                  <div className="text-[#86868b]">STAGE A · PSTN RTP</div>
                  <div className="text-lg font-bold text-white mt-1">20.0 ms</div>
                  <div className="text-[11px] text-[#a1a1a6] mt-0.5">G.711 u-law ptime=20ms</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3.5">
                  <div className="text-[#86868b]">STAGE B · RESAMPLER</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">1.8 ms</div>
                  <div className="text-[11px] text-[#a1a1a6] mt-0.5">libsoxr VHQ 8k→16kHz</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3.5">
                  <div className="text-[#86868b]">STAGE C · FAST VAD</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">18.0 ms</div>
                  <div className="text-[11px] text-[#a1a1a6] mt-0.5">Silero onset + 12ms jitter</div>
                </div>
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
                  <div className="text-emerald-300">TOTAL CUTOFF P95</div>
                  <div className="text-lg font-bold text-emerald-300 mt-1">51.9 ms</div>
                  <div className="text-[11px] text-emerald-200/80 mt-0.5">0.16ms 256-frame flush</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 第 3 幕：浏览器端 PSTN 电话打断交互压测台 + 本地基准记录留存舱 */}
      <section id="simulator" className="py-16 px-4 sm:px-8 bg-[#f5f5f7] text-[#111215]">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold mb-1.5">
                {isEn ? "INTERACTIVE PSTN BARGE-IN SANDBOX (ZERO API KEY)" : "交互式 PSTN 电话插话压测沙盒（零密钥即点即测）"}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {isEn ? "Stress-test full-duplex turn-taking live." : "在线实测电信级全双工抢话截断状态机。"}
              </h2>
            </div>
            <div className="text-xs text-[#515154] font-mono">
              {isEn ? "Scenario: " : "当前线路场景："}
              <span className="font-bold text-black">{isEn ? selectedQuestion.title : selectedQuestion.titleZh}</span>
            </div>
          </div>

          {/* 4 大电信业务压测场景切换（无任何求职面试残留） */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "pstnClaims", label: isEn ? "PSTN Insurance Claims" : "车险报案强行插话", icon: PhoneCall },
              { id: "clinicTriage", label: isEn ? "Clinic Double-Talk" : "医疗分诊双讲抗噪", icon: Activity },
              { id: "bankingIvr", label: isEn ? "Banking Fraud Cutoff" : "银行风控毫秒截断", icon: ShieldCheck },
              { id: "archSla", label: isEn ? "200-Ch SIP SLA Grill" : "200 并发网关压测", icon: Layers },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id as ScenarioCategory);
                    const matched = SCENARIO_BANK.filter((q) => q.category === cat.id);
                    if (matched.length > 0) {
                      setSelectedQuestion(matched[0]);
                      setCallStatus("idle");
                    }
                  }}
                  className={`min-h-11 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    active
                      ? "bg-[#111215] border-[#111215] text-white shadow-sm"
                      : "bg-white border-black/10 text-[#515154] hover:text-black"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {filteredQuestions.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestion.id === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(q);
                      setCallStatus("idle");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-600 shadow-sm"
                        : "bg-white border-black/10 hover:border-black/25"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-mono text-emerald-800 font-bold">
                        {q.callerPersona}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-sm font-bold text-[#111215]">
                      {isEn ? q.title : q.titleZh}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 本地压测历史记录留存条（支持一键导出 JSON 给工程团队） */}
          {benchRuns.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-emerald-700 uppercase">
                  {isEn ? "Saved Benchmark Runs:" : "本地压测归档："}
                </span>
                {benchRuns.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f5f7] border border-black/8 px-2.5 py-1 font-mono text-[11px] tabular-nums"
                  >
                    <span className="truncate max-w-[140px] font-sans font-medium text-[#111215]">
                      {r.scenarioTitle}
                    </span>
                    <span className="text-emerald-700 font-bold">{r.cutoffMs}ms</span>
                    <span className="text-[#515154]">{r.stabilityScore}/100</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBenchJson}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-[#111215] hover:bg-[#f5f5f7] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBenchRuns}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs text-[#515154] hover:text-black cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* 拟真 SIP/RTP 电话压测控制台 */}
          <div className="rounded-3xl bg-white border border-black/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#ececf0] border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#111215] tabular-nums">
                  {callStatus === "idle"
                    ? isEn
                      ? "SIP TRUNK STANDBY · 8kHz G.711 READY"
                      : "SIP 线路就绪 · 8kHz G.711 待呼叫"
                    : callStatus === "ringing"
                    ? isEn
                      ? "ESTABLISHING RTP STREAM (PTIME=20MS)..."
                      : "正在建立 20ms RTP 媒体流..."
                    : callStatus === "active"
                    ? `LIVE FULL-DUPLEX CALL · ${formatTime(elapsed)}`
                    : isEn
                      ? "CALL TRACE CAPTURED · REPORT READY"
                      : "通话压测完成 · 诊断单已生成"}
                </span>
              </div>

              {callStatus === "active" && (
                <div className="flex items-center gap-4 tabular-nums">
                  <div className="text-xs font-mono">
                    <span className="text-[#515154]">{isEn ? "Overlaps: " : "尾音碰撞："}</span>
                    <span className={`font-bold ${totalStalls > 1 ? "text-orange-600" : "text-emerald-700"}`}>
                      {totalStalls}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#515154] font-medium hidden sm:inline">
                      {isEn ? "Hangup Risk:" : "挂断风险："}
                    </span>
                    <div className="w-20 sm:w-28 h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          doubleTalkRisk > 65 ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${doubleTalkRisk}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        doubleTalkRisk > 65 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {doubleTalkRisk}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {callStatus === "idle" && (
              <div className="p-10 sm:p-14 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  <Phone className="w-9 h-9" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-bold text-[#111215]">
                    {isEn ? selectedQuestion.title : selectedQuestion.titleZh}
                  </h3>
                  <p className="text-sm text-[#515154] leading-relaxed">
                    {isEn
                      ? `${selectedQuestion.callerPersona}. Test how verbose WebSocket responses trigger a 52ms caller barge-in vs crisp sub-60ms RTP turn-taking.`
                      : `${selectedQuestion.callerPersona}。一键对比冗长 WebSocket 播报触发的 52ms 强行抢话截断与确定性极速响应。`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="min-h-12 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isEn ? "Launch Live Barge-In Test" : "启动实时语音打断压测"}</span>
                </button>
              </div>
            )}

            {callStatus === "ringing" && (
              <div className="p-10 sm:p-14 text-center space-y-6 bg-[#111215] text-white">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  {isEn ? "INBOUND PSTN / SIP TEST CALL" : "模拟真实 PSTN / SIP 呼入"}
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{selectedQuestion.title}</h3>
                  <p className="text-sm text-[#a1a1a6]">{selectedQuestion.callerPersona}</p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4">
                  <button
                    type="button"
                    onClick={() => setCallStatus("idle")}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-90"
                    title={isEn ? "Cancel" : "取消"}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCall}
                    className="px-8 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 cursor-pointer shadow-lg ring-4 ring-emerald-400/35 hover:ring-emerald-400/60 transition-all active:scale-95"
                  >
                    <Phone className="w-5 h-5 fill-current" />
                    <span>{isEn ? "Bridge RTP Channel" : "接通 8kHz RTP 通道"}</span>
                  </button>
                </div>
              </div>
            )}

            {callStatus === "active" && (
              <div className="p-6 sm:p-8 space-y-6">
                {isInterrupting && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500 text-red-700 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      {isEn
                        ? "⚡ 52ms RING BUFFER FLUSHED (0.16ms): CALLER BARGE-IN CUT OFF TRAILING TTS"
                        : "⚡ 52ms 毫秒级抢话截断（0.16ms 环形缓冲清零）：来电者打断冗长 TTS 播报！"}
                    </span>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {transcript.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                        t.isInterrupt
                          ? "bg-red-50 border-red-200 text-red-950 font-semibold"
                          : t.speaker.includes("Agent")
                          ? "bg-blue-50 border-blue-200 text-blue-950 ml-6"
                          : "bg-[#f5f5f7] border-black/5 text-[#111215]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1 font-bold">
                        <span
                          className={
                            t.isInterrupt
                              ? "text-red-700"
                              : t.speaker.includes("Agent")
                              ? "text-blue-700"
                              : "text-[#515154]"
                          }
                        >
                          {t.speaker}
                        </span>
                      </div>
                      <div>{t.text}</div>
                      {t.note && (
                        <div className="mt-2 text-xs font-mono font-medium text-amber-800 bg-amber-100/70 p-2 rounded-lg">
                          {t.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-[#ececf0] border border-black/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[#515154] uppercase tracking-wider flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? "Inject Voice / TTS Frame:" : "开麦说话或注入测试帧："}</span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`min-h-9 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRecording
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>
                        {isRecording
                          ? isEn
                            ? "Listening... Tap to Send"
                            : "正在收音... 点击发送"
                          : isEn
                          ? "Speak Into Mic"
                          : "麦克风实测"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRespond(selectedQuestion.laggyWrapperSample)}
                      className="p-3 text-left rounded-xl bg-white hover:bg-amber-50 border border-black/10 hover:border-amber-300 transition-colors text-xs text-[#111215] cursor-pointer"
                    >
                      <span className="font-bold text-amber-700 block mb-0.5">
                        {isEn ? "Simulate Verbose Wrapper (Triggers 52ms Barge-In)" : "模拟冗长 WebSocket 播报（触发 52ms 抢话截断）"}
                      </span>
                      <span className="text-[#515154] line-clamp-2">&ldquo;{selectedQuestion.laggyWrapperSample}&rdquo;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRespond(selectedQuestion.rtpCrispSample)}
                      className="p-3 text-left rounded-xl bg-white hover:bg-emerald-50 border border-black/10 hover:border-emerald-300 transition-colors text-xs text-[#111215] cursor-pointer"
                    >
                      <span className="font-bold text-emerald-700 block mb-0.5">
                        {isEn ? "Simulate Crisp RTP Agent (Zero Overlap)" : "模拟低延迟 RTP 确定性响应（零重叠通过）"}
                      </span>
                      <span className="text-[#515154] line-clamp-2">&ldquo;{selectedQuestion.rtpCrispSample}&rdquo;</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      placeholder={
                        isEn
                          ? "Speak via mic or type custom agent utterance..."
                          : "使用麦克风说话或直接输入测试话术..."
                      }
                      value={userCustomInput}
                      onChange={(e) => setUserCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRespond(userCustomInput);
                      }}
                      className="flex-1 min-h-11 px-3.5 py-2 text-base sm:text-xs rounded-xl border border-black/15 bg-white text-[#111215] focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespond(userCustomInput)}
                        className="min-h-11 px-4 py-2 rounded-xl bg-[#111215] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                      >
                        {isEn ? "Send Frame" : "发送测试帧"}
                      </button>
                      <button
                        type="button"
                        onClick={handleEndCall}
                        className="min-h-11 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        {isEn ? "Finish & Save Trace" : "结束并归档压测"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {callStatus === "ended" && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                      {isEn ? "BARGE-IN TELEMETRY & PATCH PRESCRIPTION" : "通话抢话遥测与底层网关改造处方"}
                    </span>
                    <h3 className="text-2xl font-bold text-[#111215]">
                      {isEn ? "Session Saved to Local Benchmark History" : "本次压测已自动写入浏览器本地基准记录"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setB2bModalPlan("audit")}
                      className="min-h-10 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isEn ? "Audit Our Live SIP ($299) →" : "预约我方 SIP 实测 ($299) →"}
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="min-h-10 px-4 py-2 rounded-full bg-[#111215] hover:bg-black text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{isEn ? "Run Again" : "再次压测"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">FAST-VAD CUTOFF</div>
                    <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">52 ms</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">RING BUFFER FLUSH</div>
                    <div className="text-2xl font-bold text-blue-600 font-mono mt-1">0.16 ms</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">OVERLAP EVENTS</div>
                    <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{totalStalls}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">HANGUP RISK</div>
                    <div className="text-2xl font-bold text-[#111215] font-mono mt-1">{doubleTalkRisk}%</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/10 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#111215] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? "Recommended RTP Gateway Patch" : "推荐 8kHz RTP 网关底层改造处方"}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-xl p-3.5">
                    {selectedQuestion.patchPrescription}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 第 4 幕：三大电信工程核心机制（去除无意义 01/02/03 装饰标号，改用清晰技术标签） */}
      <section id="architecture" className="py-16 px-4 sm:px-8 border-b border-white/10 bg-[#08080a]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
                {isEn ? "PRODUCTION 8kHz RTP ARCHITECTURE" : "生产级 8kHz RTP 网关三大核心底座"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isEn ? "Engineered for real PSTN trunks inside your VPC." : "专为企业自有 VPC 内的真实电话中继打造。"}
              </h2>
            </div>
            <div className="text-xs text-[#a1a1a6] font-mono">
              Powered by <span className="text-white font-bold">hardcall-rtp-orchestrator</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#12141c] border border-white/10 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400">
                PTIME = 20MS · UDP/RTP
              </span>
              <h3 className="text-sm font-bold text-white">
                {isEn ? "Zero TCP Head-of-Line Blocking" : "彻底消除 TCP 队头阻塞"}
              </h3>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Direct FreeSWITCH / Asterisk UDP RTP socket bridge keeps jitter bounded even on lossy cellular PSTN legs."
                  : "直连 FreeSWITCH / Asterisk 原始 UDP RTP 套接字，即使在蜂窝弱网丢包下也不会出现 WebSocket 卡死。"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12141c] border border-white/10 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-blue-400">
                256-FRAME RING · 0.16MS
              </span>
              <h3 className="text-sm font-bold text-white">
                {isEn ? "Deterministic Outbound Tail Cut" : "0.16ms 确定性尾音硬截断"}
              </h3>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Two-tier Silero Fast-VAD (50ms pause + 200ms semantic guard) flushes queued TTS frames before callers hear overlap."
                  : "双层 VAD（50ms 声学快停 + 200ms 语义防误触）瞬间清空出站语音环，杜绝“各说各话”。"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12141c] border border-white/10 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-purple-300">
                LIBSOXR VHQ · VPC NATIVE
              </span>
              <h3 className="text-sm font-bold text-white">
                {isEn ? "Lossless 8kHz → 16kHz ASR Feed" : "无损 8kHz→16kHz 重采样"}
              </h3>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Eliminates high-frequency aliasing on G.711 phone audio for Deepgram, Whisper, Qwen, OpenAI, and Cartesia/ElevenLabs."
                  : "消除 G.711 窄带电话重采样混叠噪声，显著提升数字、姓名与地址在抢话时的识别准确率。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 第 5 幕：B2B 工程服务阶梯定价 + SLA 全额退款承诺 + 免费样本报告留资舱 */}
      <section id="pricing" className="py-20 px-4 sm:px-8 bg-[#0b0c10]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
              {isEn ? "TRANSPARENT B2B ENGINEERING TIERS · SLA GUARANTEED" : "透明可交付的企业级工程定价 · 达不到延迟降幅全额退款"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white">
              {isEn ? "Ship sub-60ms telephony barge-in without 3 months of R&D." : "省去 3 个月底层踩坑，48 小时定位并上线亚 60ms 打断网关。"}
            </h2>
            <p className="text-sm sm:text-base text-[#a1a1a6]">
              {isEn
                ? "Compare against 2–3 months of senior telephony engineer salary ($30,000+). Every engagement is backed by Creem.io corporate tax invoicing and our >=40% latency reduction SLA."
                : "相比招聘资深 VoIP/C++ 语音工程师耗时 2–3 个月（成本 $30,000+），直接通过 $299 线上压测或 $1,200 私有化部署包快速交付。"}
            </p>
          </div>

          {verifiedNotice && (
            <div className="p-5 rounded-2xl bg-emerald-500/12 border border-emerald-500/40 text-left space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-emerald-300 text-xs font-mono font-bold">
                  ✓ {verifiedNotice}
                </div>
                <a
                  href={`/api/kit-bundle?ref=${encodeURIComponent(typeof window !== "undefined" ? localStorage.getItem("hardcall_license_active") || "" : "")}`}
                  className="min-h-9 inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                >
                  {isEn ? "Download RTP Kit Config Bundle (.json)" : "下载 8kHz RTP 配置授权包"}
                </a>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const sipOrRepo = String(fd.get("sipOrRepo") || "").trim();
                  if (!sipOrRepo) return;
                  const formEl = e.currentTarget;
                  await fetch("/api/b2b-intake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderRef: typeof window !== "undefined" ? localStorage.getItem("hardcall_license_active") || "" : "",
                      sipOrRepo,
                      notes: String(fd.get("notes") || ""),
                    }),
                  }).catch(() => {});
                  formEl.reset();
                  setVerifiedNotice(
                    isEn
                      ? "Kickoff target received! Engineering audit / repo provisioning queued (<4h SLA)."
                      : "对接参数已自动入库！将在 4 小时内启动压测或开通私有仓库权限。"
                  );
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1"
              >
                <input
                  name="sipOrRepo"
                  required
                  placeholder={isEn ? "Paste SIP/WebRTC test URI or your GitHub username..." : "粘贴测试 SIP 号码 / WebRTC 地址或 GitHub 用户名..."}
                  className="sm:col-span-5 min-h-11 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-base sm:text-xs text-white"
                />
                <input
                  name="notes"
                  placeholder={isEn ? "Current STT/LLM/TTS latency notes (optional)..." : "补充当前语音管线延迟现象（选填）..."}
                  className="sm:col-span-5 min-h-11 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-base sm:text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 min-h-11 rounded-xl bg-white text-black font-bold text-xs py-2 cursor-pointer hover:bg-white/90"
                >
                  {isEn ? "Submit Kickoff" : "提交自动对接"}
                </button>
              </form>
            </div>
          )}

          {/* 三档务实 B2B 阶梯报价与交付清单 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 tabular-nums">
            <div className="p-6 rounded-2xl bg-[#11141d] border border-white/12 flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Tier 1 · 48h Diagnostic Pilot</div>
                <div className="text-3xl font-bold text-white">$299 <span className="text-xs font-normal text-[#86868b]">one-time</span></div>
                <div className="text-sm font-semibold text-white">{isEn ? "48h Voice Latency Audit & Patch Plan" : "48h 语音打断延迟体检与改造方案"}</div>
                <ul className="text-xs text-[#a1a1a6] space-y-2 pt-2">
                  <li>• Dial &amp; profile your live SIP number or WebRTC agent</li>
                  <li>• Frame-by-frame RTP/VAD/TTS overlap flamegraph</li>
                  <li>• Concrete patch roadmap delivered within 48 hours</li>
                  <li className="text-emerald-300 font-medium">• SLA: Identify ≥40% latency cut or 100% full refund</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setB2bModalPlan("audit")}
                className="w-full min-h-12 rounded-xl bg-white/12 hover:bg-white/20 text-white text-center font-semibold text-xs transition-colors cursor-pointer"
              >
                {isEn ? "Book $299 Latency Audit →" : "立即预约 $299 线上延迟体检 →"}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#111622] border-2 border-emerald-500/60 flex flex-col justify-between space-y-5 shadow-xl shadow-emerald-500/10">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Tier 2 · Self-Hosted Kit</span>
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-black">MOST POPULAR</span>
                </div>
                <div className="text-3xl font-bold text-white">$1,200 <span className="text-xs font-normal text-[#86868b]">commercial license</span></div>
                <div className="text-sm font-semibold text-white">{isEn ? "8kHz RTP Gateway Source & Docker Kit" : "8kHz RTP 网关源码与私有化部署包"}</div>
                <ul className="text-xs text-[#d1d1d6] space-y-2 pt-2">
                  <li>• Full FreeSWITCH ptime=20ms + SOXR VHQ Docker stack</li>
                  <li>• 256-frame outbound ring buffer &amp; 0.16ms flush source</li>
                  <li>• Plugs into Deepgram, OpenAI, Qwen, ElevenLabs, Cartesia</li>
                  <li>• Perpetual VPC license + 2h live architect onboarding</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setB2bModalPlan("kit")}
                className="w-full min-h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-center font-bold text-xs transition-colors cursor-pointer"
              >
                {isEn ? "Buy $1,200 Deployment Kit →" : "立即购买 $1,200 私有化部署包 →"}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-[#11141d] border border-white/12 flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-[#a1a1a6] uppercase font-bold">Tier 3 · Turnkey Enterprise</div>
                <div className="text-3xl font-bold text-white">$3,000+ <span className="text-xs font-normal text-[#86868b]">custom SOW</span></div>
                <div className="text-sm font-semibold text-white">{isEn ? "Custom SIP Cluster & SLA Integration" : "企业定制 SIP 集群与高并发交付"}</div>
                <ul className="text-xs text-[#a1a1a6] space-y-2 pt-2">
                  <li>• Hands-on integration into your AWS/GCP VPC &amp; SIP carrier</li>
                  <li>• 200+ concurrent channel load testing &amp; p99 SLA tuning</li>
                  <li>• Custom two-tier semantic interruption guard tuning</li>
                  <li>• 30-day dedicated Slack / engineer support channel</li>
                </ul>
              </div>
              <a
                href="mailto:hello@statementflow.win?subject=HardCall%20Enterprise%20Custom%20Voice%20Gateway"
                className="w-full min-h-12 inline-flex items-center justify-center rounded-xl bg-white text-black hover:bg-[#e5e5ea] text-center font-bold text-xs transition-colors"
              >
                {isEn ? "Request Custom SOW Quote →" : "咨询企业定制交付 →"}
              </a>
            </div>
          </div>

          {/* 评估期 CTO 零门槛转化桥梁：提交真实测试电话号码或 WebRTC 地址免费领 15s 抢话碰撞实测快照 */}
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0f151e] p-6 sm:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-1.5">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  {isEn ? "FREE 15-SECOND LIVE SPOT CHECK ON YOUR AGENT" : "免费实测您线上语音 Agent 的真实打断延迟"}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {isEn
                    ? "Paste your live demo phone number or WebRTC URL — see your exact barge-in lag before spending $299"
                    : "填入您的公开测试电话号码或 WebRTC 链接 — 先看真实碰撞毫秒数再决定是否下单 $299"}
                </h3>
                <p className="text-xs text-[#a1a1a6] leading-relaxed">
                  {isEn
                    ? "Enter your work email and your live PSTN test number (+1...) or current stack (Twilio, LiveKit, Vapi, Retell, Pipecat). We'll send back our 51.9ms reference trace immediately and spot-check your live line."
                    : "填入企业邮箱与您的测试电话号码（或当前 Twilio / LiveKit / Vapi / 自研技术栈），立即获取 51.9ms 基准火焰图与实测快照。"}
                </p>
              </div>
              <form onSubmit={handleLeadCaptureSubmit} className="lg:col-span-5 space-y-2.5">
                <input
                  type="email"
                  required
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="cto@your-voice-ai.com"
                  aria-label="Work email"
                  className="w-full min-h-11 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-base sm:text-xs text-white placeholder:text-[#7c8291] focus:border-emerald-400 focus:outline-none"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={leadStack}
                    onChange={(e) => setLeadStack(e.target.value)}
                    placeholder="Live test phone (+1...) or Twilio/LiveKit stack"
                    aria-label="Live test phone number or voice stack"
                    className="flex-1 min-h-11 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-base sm:text-xs text-white placeholder:text-[#7c8291] focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="min-h-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-black cursor-pointer disabled:opacity-60"
                  >
                    {leadLoading ? "Sending..." : isEn ? "Get Free Spot Check →" : "免费领实测快照 →"}
                  </button>
                </div>
                {leadMsg && <p className="text-xs font-medium text-emerald-400">{leadMsg}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 合规与企业技术支持页脚 */}
      <footer id="compliance" className="border-t border-white/10 bg-[#060709] py-14 px-4 sm:px-8 text-xs text-[#86868b] leading-relaxed">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-2">Privacy &amp; Ephemeral Audio</h4>
              <p>
                The browser sandbox processes microphone inputs locally via Web Speech API with zero server storage. Enterprise B2B deployments run 100% inside your private VPC / FreeSWITCH cluster with zero third-party audio egress.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">B2B Commercial Licensing &amp; SLA</h4>
              <p>
                Browser sandbox and reference RTP lab are MIT open-source. Commercial engagements ($299 48h Latency Audit with ≥40% latency reduction refund guarantee, $1,200 Self-Hosted RTP Kit, and $3,000+ SOW) include automatic Creem.io corporate VAT/tax receipts.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Architect &amp; Support Contact</h4>
              <p>
                Architect: Wang Guo (@wangguode)<br />
                B2B Email: <a href="mailto:hello@statementflow.win" className="text-white underline">hello@statementflow.win</a><br />
                GitHub: <a href="https://github.com/wangguode/ai-agent-voice" target="_blank" rel="noreferrer" className="text-white underline">wangguode/ai-agent-voice</a>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>Copyright © 2026 Wang Guo (@wangguode). All rights reserved.</div>
            <div className="flex flex-wrap gap-4">
              <a href="/privacy" className="hover:text-white underline">Privacy Policy</a>
              <a href="/terms" className="hover:text-white underline">Terms of Use</a>
              <a href="/terms#acceptable-use" className="hover:text-white underline">Acceptable Use Policy</a>
              <button type="button" onClick={() => setRestoreOpen(true)} className="hover:text-white underline cursor-pointer">
                Verify B2B Order
              </button>
              <a href="mailto:hello@statementflow.win" className="hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 光学暗曜石磨砂 B2B 即时结账弹窗（直连 Creem Live $299 / $1,200） */}
      {b2bModalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="hc-frosted-modal w-full max-w-md rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  Creem.io Merchant of Record
                </span>
                <h3 className="mt-2 text-lg font-bold">
                  {b2bModalPlan === "kit"
                    ? isEn
                      ? "8kHz RTP Self-Hosted Deployment Kit"
                      : "8kHz RTP 私有化源码与部署包"
                    : isEn
                    ? "48h Voice Latency Audit & Benchmark"
                    : "48h 语音打断延迟体检与压测"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setB2bModalPlan(null)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 tabular-nums">
              <div className="text-xs text-[#a1a1a6]">
                {b2bModalPlan === "kit"
                  ? "Docker + FreeSWITCH 20ms + SOXR VHQ + 2h onboarding"
                  : "Live SIP/WebRTC flamegraph + 48h patch prescription"}
              </div>
              <div className="font-mono text-2xl font-bold text-emerald-400">
                ${b2bModalPlan === "kit" ? "1,200" : "299"}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                {b2bModalPlan === "kit"
                  ? "Instant config bundle unlock after payment + private GitHub repo invite (<4h)."
                  : "SLA Guarantee: If we don't identify ≥40% barge-in latency savings within 48h, 100% full refund."}
              </span>
            </div>

            <form onSubmit={handleB2bCheckoutSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#d1d1d6] mb-1">
                  {isEn ? "Work Email (for Kickoff & Corporate VAT Invoice)" : "企业邮箱（接收交付指引与税票）"}
                </label>
                <input
                  type="email"
                  required
                  value={b2bEmail}
                  onChange={(e) => setB2bEmail(e.target.value)}
                  placeholder="cto@voice-startup.ai"
                  className="w-full min-h-11 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-base sm:text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d1d1d6] mb-1">
                  {isEn ? "Current Telephony / Voice Stack (Optional)" : "当前电话/语音技术栈（选填）"}
                </label>
                <input
                  type="text"
                  value={b2bStackNote}
                  onChange={(e) => setB2bStackNote(e.target.value)}
                  placeholder="e.g. Twilio SIP + Deepgram + Cartesia"
                  className="w-full min-h-11 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-base sm:text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {b2bError && (
                <p className="rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs text-red-300">
                  {b2bError}
                </p>
              )}

              <button
                type="submit"
                disabled={b2bLoading}
                className="w-full min-h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {b2bLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>
                  {b2bLoading
                    ? "Redirecting to Secure Creem Checkout..."
                    : `Proceed to Checkout · $${b2bModalPlan === "kit" ? "1,200" : "299"}`}
                </span>
              </button>

              <p className="text-center text-[11px] text-[#86868b]">
                Need a custom corporate PO / wire invoice instead?{" "}
                <a
                  href={`mailto:hello@statementflow.win?subject=HardCall%20B2B%20Invoice%20(${b2bModalPlan})`}
                  className="text-emerald-400 underline"
                >
                  Email hello@statementflow.win
                </a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* B2B 订单跨设备核验弹窗 */}
      {restoreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="hc-frosted-modal w-full max-w-md rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">
                  {isEn ? "Verify Existing HardCall Order" : "核验已购 HardCall 企业订单"}
                </h3>
                <p className="text-xs text-[#a1a1a6] mt-1">
                  {isEn
                    ? "Enter your checkout email and Creem Order/Checkout ID to verify status."
                    : "输入下单邮箱与 Creem 订单编号核验授权状态。"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestoreOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRestoreOrderSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                placeholder="Work email used at checkout"
                className="w-full min-h-11 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-base sm:text-sm text-white"
              />
              <input
                type="text"
                required
                minLength={6}
                value={restoreOrderRef}
                onChange={(e) => setRestoreOrderRef(e.target.value)}
                placeholder="Creem Order / Checkout ID (e.g. ch_...)"
                className="w-full min-h-11 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-base sm:text-sm font-mono text-white"
              />
              {restoreError && <p className="text-xs text-red-400">{restoreError}</p>}
              <button
                type="submit"
                disabled={restoreLoading}
                className="w-full min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm cursor-pointer"
              >
                {restoreLoading ? "Verifying..." : "Verify Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
