"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lock,
  Apple,
  Globe,
  ChevronRight,
  Star,
  Play,
  Square,
  Flame,
  Zap,
  AlertCircle,
  Layers,
  BarChart3,
  Server,
} from "lucide-react";

type DrillCategory = "behavioral" | "systemDesign" | "salaryNegotiation" | "presentationPitch";

interface DrillQuestion {
  id: string;
  category: DrillCategory;
  categoryName: string;
  categoryNameZh: string;
  title: string;
  titleZh: string;
  role: string;
  opener: string;
  interruptLine: string;
  strongFollowUp: string;
  weakSample: string;
  strongSample: string;
  rewrite: string;
}

const QUESTION_BANK: DrillQuestion[] = [
  // 1. FAANG Behavioral
  {
    id: "bh_outage",
    category: "behavioral",
    categoryName: "FAANG Behavioral & Leadership",
    categoryNameZh: "FAANG 行为与领导力面试",
    title: "Production Outage & Team Disagreement",
    titleZh: "高压线上事故与技术分歧辩护",
    role: "Sarah Chen · Staff EM @ Stripe",
    opener:
      "Hi. Let's skip the resume recitation—I only have ten minutes. Tell me about the hardest production failure YOU personally fixed, and give me exact numbers in your first thirty seconds.",
    interruptLine:
      "Hold on—stop right there. You keep saying 'we kind of helped' and giving background fluff. What did YOU specifically ship, and what metric moved?",
    strongFollowUp:
      "42% p99 latency reduction—that's concrete. Now defend the trade-off: what broke or degraded when you bypassed that synchronous lock?",
    weakSample:
      "Um, so last year our team was kind of working on checkout performance and I think maybe we helped optimize some database queries...",
    strongSample:
      "I owned the checkout lock migration. By splitting async settlement for orders above $5K, I cut p99 latency by 42% with zero dropped webhooks.",
    rewrite:
      "\"I owned the checkout lock migration, cutting p99 latency from 820ms to 475ms (-42%) across 1.2M daily transactions.\"",
  },
  {
    id: "bh_deadline",
    category: "behavioral",
    categoryName: "FAANG Behavioral & Leadership",
    categoryNameZh: "FAANG 行为与领导力面试",
    title: "Impossible Deadline & Scope Cut",
    titleZh: "不可延期的合规死线与极限砍需求",
    role: "Sarah Chen · Staff EM @ Stripe",
    opener:
      "Your VP cuts delivery timeline from 6 months to 6 weeks for a non-negotiable regulatory deadline. How do you decide what to sacrifice?",
    interruptLine:
      "Stop. Don't say 'we worked harder' or 'aligned stakeholders'. Give me the exact formula or boundary you used to cut scope without violating audit rules.",
    strongFollowUp:
      "Sharp framework. Now tell me how you handled the angry product director whose core feature got punted to Q3.",
    weakSample:
      "Well, you know, we had a bunch of meetings and tried to talk to everyone and work overtime to deliver as much as we could...",
    strongSample:
      "I categorized all 28 requirements against mandatory regulatory compliance: 8 were non-negotiable legal gates, 20 were UX enhancements. We shipped only the 8 and passed audit on day 41.",
    rewrite:
      "\"I isolated the 8 audit-critical invariants from 20 UX enhancements, freezing the rest. We hit day 41 with 100% compliance and zero regulatory fines.\"",
  },

  // 2. System Design
  {
    id: "sd_idempotency",
    category: "systemDesign",
    categoryName: "System Design & Arch Defense",
    categoryNameZh: "系统设计与架构答辩",
    title: "Payment Idempotency & Webhook Packet Drops",
    titleZh: "80,000 QPS 支付幂等性与掉包抗灾",
    role: "Alex Mercer · Principal Architect @ Datadog",
    opener:
      "Your payment webhook drops 3.5% of ACK packets during Black Friday traffic spikes. Walk me through your idempotency key lifecycle and state machine.",
    interruptLine:
      "Wait—you just said 'put a unique index in Postgres'. At 80,000 requests per second, your database connection pool is dead in 4 seconds. How does your cache layer protect it?",
    strongFollowUp:
      "Redis SETNX with an exponential lease time and token bucket rate limiter—good. What happens if the Redis master fails over mid-transaction?",
    weakSample:
      "Um, I think maybe we can just query the database first to see if the order exists, and if it does we sort of ignore it...",
    strongSample:
      "We enforce idempotency at the API gateway using distributed Redis SETNX with a 120-second lease, backed by a unique idempotency_key constraint in PostgreSQL for ultimate consistency.",
    rewrite:
      "\"We gate orders via two-tier idempotency: gateway Redis leases (120s TTL) for 80k rps deduplication, backed by Postgres unique constraints to guarantee zero double charges.\"",
  },

  // 3. Salary Negotiation
  {
    id: "sal_negotiation",
    category: "salaryNegotiation",
    categoryName: "Salary & Comp Pushback",
    categoryNameZh: "薪酬谈判与破职级天花板",
    title: "Breaking the $160K Salary Band Ceiling",
    titleZh: "突破 $160K 薪水上限与竞品 Offer 抬价",
    role: "Rachel Sterling · VP of Talent @ Series-D AI Unicorn",
    opener:
      "Congrats on passing the loop. Look, you asked for $185K base, which is $25K above our band for this level. Give me one compelling reason I shouldn't cap this offer at $160K right now.",
    interruptLine:
      "Wait—don't tell me about living costs or how hard you worked. Every candidate says that. Tell me the competing leverage or day-one revenue impact I'm buying.",
    strongFollowUp:
      "Fair point—having a competing $182K offer plus owning our enterprise onboarding changes the math. If I move base to $180K and add $30K equity, do you sign today?",
    weakSample:
      "Well I think maybe because living in the Bay Area is really expensive and I kind of really hope you can match my expectations...",
    strongSample:
      "I hold a competing written offer at $182K base, and my prior onboarding redesign lifted enterprise conversion by 19% in 60 days. Match $185K and I sign today.",
    rewrite:
      "\"I hold a competing $182K base offer in hand, and I'll bring the exact onboarding playbook that lifted paid enterprise conversion by 19% in Q1.\"",
  },

  // 4. Presentation & Pitch Drills (演讲与路演实操)
  {
    id: "pitch_yc",
    category: "presentationPitch",
    categoryName: "Presentation & Pitch Drills",
    categoryNameZh: "演说路演与高管答辩实战",
    title: "Y Combinator 2-Minute Demo Day Pitch",
    titleZh: "YC 风格 2 分钟极速商业路演答辩",
    role: "Garry Tan (Simulated) · Managing Partner",
    opener:
      "You have two minutes on stage. Don't waste thirty seconds telling me about generic industry trends. What do you build, who pays you today, and why does Google not crush you tomorrow?",
    interruptLine:
      "Stop—twenty seconds in and you haven't mentioned customer traction or revenue. How many paying customers are actively using this today?",
    strongFollowUp:
      "$48K MRR growing 24% month-over-month with net revenue retention at 128%—that gets my attention. What is your proprietary distribution channel?",
    weakSample:
      "Hi everyone! Basically, our platform leverages next-gen AI to revolutionize enterprise workflows, and you know, the total addressable market is like $500 billion...",
    strongSample:
      "We build HardCall: the high-pressure AI voice mock interviewer that cuts candidate interview failure by 60%. We are at $48K MRR with 24% MoM growth, distributed virally via App Store and TikTok.",
    rewrite:
      "\"We automate high-stakes voice interview prep, doing $48K MRR at 24% MoM growth with 84% gross margins. 100% customer acquisition is viral TikTok demos.\"",
  },
  {
    id: "pitch_keynote",
    category: "presentationPitch",
    categoryName: "Presentation & Pitch Drills",
    categoryNameZh: "演说路演与高管答辩实战",
    title: "Architecture Review: Dropping Microservices",
    titleZh: "架构委员会答辩：微服务回退单体提案",
    role: "Architecture Review Board Committee",
    opener:
      "You are proposing to consolidate 14 Kubernetes microservices back into a modular monolith. That's a huge architectural reversal. Pitch this to the board in sixty seconds.",
    interruptLine:
      "Hold it—you're talking about developer happiness. Our board cares about cloud spend and p99 availability. Quantify the operational savings.",
    strongFollowUp:
      "Eliminating cross-service gRPC serialization cut AWS NAT gateway egress by $18,000/month and dropped p99 tail latency by 38ms. You have board approval.",
    weakSample:
      "Um, you know, microservices have too much overhead and developers sort of complain about local setup, so we think it's better to simplify...",
    strongSample:
      "Consolidating our 14 services eliminates 320ms cross-service network hop latency, cuts $18,000/month in AWS inter-AZ egress fees, and reduces our deployment failure rate by 65%.",
    rewrite:
      "\"Consolidating 14 services back to a modular monolith eliminates 320ms network hops, slashes $18K/mo in cloud egress, and reduces p99 incident rate by 65%.\"",
  },
];

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const isEn = lang === "en";

  const [activeCategory, setActiveCategory] = useState<DrillCategory>("behavioral");
  const [selectedQuestion, setSelectedQuestion] = useState<DrillQuestion>(QUESTION_BANK[0]);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "active" | "ended">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [skepticism, setSkepticism] = useState(50);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [transcript, setTranscript] = useState<
    { speaker: string; text: string; isInterrupt: boolean; note?: string }[]
  >([]);
  const [userCustomInput, setUserCustomInput] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<"weekly" | "lifetime">("weekly");
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  // Real-time Mic Recording State (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Filler word stats
  const [fillerCounts, setFillerCounts] = useState<{ [key: string]: number }>({
    "um/uh": 0,
    like: 0,
    "you know": 0,
    "kind of": 0,
  });

  // Filter questions by category
  const filteredQuestions = QUESTION_BANK.filter((q) => q.category === activeCategory);

  // Timer
  useEffect(() => {
    let t: any;
    if (callStatus === "active") {
      t = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(t);
  }, [callStatus]);

  // Web Speech API initialization
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

        reco.onerror = () => {
          setIsRecording(false);
        };

        reco.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = reco;
      } else {
        setMicSupported(false);
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
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const handleStartCall = () => {
    setCallStatus("ringing");
    setTranscript([]);
    setElapsed(0);
    setSkepticism(55);
    setIsInterrupting(false);
    setFillerCounts({ "um/uh": 0, like: 0, "you know": 0, "kind of": 0 });
  };

  const handleAcceptCall = () => {
    setCallStatus("active");
    setTranscript([
      {
        speaker: selectedQuestion.role,
        text: selectedQuestion.opener,
        isInterrupt: false,
      },
    ]);
  };

  const handleRespond = (textToSubmit: string) => {
    if (!textToSubmit.trim()) return;
    const text = textToSubmit.trim();
    setUserCustomInput("");

    // Analyze filler words
    const lower = text.toLowerCase();
    const nextFillers = { ...fillerCounts };
    if (lower.includes("um") || lower.includes("uh")) nextFillers["um/uh"] += 1;
    if (lower.includes("like")) nextFillers["like"] += 1;
    if (lower.includes("you know")) nextFillers["you know"] += 1;
    if (lower.includes("kind of") || lower.includes("sort of")) nextFillers["kind of"] += 1;
    setFillerCounts(nextFillers);

    const newTranscript = [
      ...transcript,
      { speaker: "You (Voice / Mic)", text, isInterrupt: false },
    ];

    const isWeak =
      lower.includes("um") ||
      lower.includes("kind of") ||
      lower.includes("maybe") ||
      lower.includes("you know") ||
      lower.includes("we helped") ||
      !/\d/.test(text);

    if (isWeak) {
      setSkepticism((prev) => Math.min(95, prev + 25));
      setIsInterrupting(true);
      setTimeout(() => setIsInterrupting(false), 1200);

      newTranscript.push({
        speaker: `${selectedQuestion.role} [INTERRUPTED IN 52ms]`,
        text: selectedQuestion.interruptLine,
        isInterrupt: true,
        note: isEn
          ? "Triggered 52ms Barge-In: Detected filler words / lack of hard ownership metrics."
          : "触发 52ms 强行抢话打断：检测到口癖套话及缺乏量化指标。",
      });
    } else {
      setSkepticism((prev) => Math.max(15, prev - 25));
      newTranscript.push({
        speaker: selectedQuestion.role,
        text: selectedQuestion.strongFollowUp,
        isInterrupt: false,
        note: isEn
          ? "Passed Grill: High ownership and hard metrics lowered skepticism."
          : "通过考核：明确的个人权责与硬核指标使考官疑虑大幅下降。",
      });
    }

    setTranscript(newTranscript);
  };

  const handleEndCall = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setCallStatus("ended");
  };

  const handleRedeemPromo = () => {
    if (promoCode.toUpperCase().startsWith("HC-")) {
      setPromoMessage(isEn ? "VIP Pass Activated (Local Sandbox)" : "VIP 通行码已在本地沙盒激活成功！");
    } else {
      setPromoMessage(isEn ? "Invalid code. Format: HC-OFFER-2026" : "无效兑换码。示例格式：HC-OFFER-2026");
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalFillers = Object.values(fillerCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#08080a] text-[#f5f5f7] selection:bg-[#0071e3] selection:text-white">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 h-12 backdrop-blur-xl bg-[#08080a]/80 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 font-semibold text-sm tracking-tight">
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center text-xs font-bold">
              <Phone className="w-3 h-3 fill-current" />
            </span>
            <span className="font-bold">HardCall</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-xs text-[#a1a1a6]">
            <a href="#bank" className="hover:text-white transition-colors">
              {isEn ? "Question Bank" : "结构化题库"}
            </a>
            <a href="#simulator" className="hover:text-white transition-colors">
              {isEn ? "Live Voice Simulator" : "语音对练实测"}
            </a>
            <a href="#presentation" className="hover:text-white transition-colors">
              {isEn ? "Keynote & Pitch" : "演说路演专区"}
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              {isEn ? "RTP Gateway Hybrid" : "语音网关架构"}
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              {isEn ? "Pricing" : "价格"}
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(isEn ? "zh" : "en")}
            className="flex items-center gap-1 text-xs text-[#a1a1a6] hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isEn ? "中文" : "EN"}</span>
          </button>
          <a
            href="#pricing"
            className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors"
          >
            {isEn ? "Get Offer Pass" : "获取通行证"}
          </a>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-8 border-b border-white/10 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex max-w-full items-center justify-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] sm:text-xs font-medium text-emerald-400">
            <Apple className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {isEn
                ? "Native iOS & Mac App · Built with Swift 6, Speech & StoreKit 2"
                : "纯正 iOS & Mac 原生应用 · Swift 6 + Apple Speech + StoreKit 2"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight text-white">
            {isEn ? (
              <>
                <span className="block">ChatGPT is polite.</span>
                <span className="text-emerald-400 block mt-1">
                  Real interviewers <br className="sm:hidden" />
                  interrupt.
                </span>
              </>
            ) : (
              <>
                <span className="block">ChatGPT 太礼貌了。</span>
                <span className="text-emerald-400 block mt-1">
                  真正的面试官与评委，随时打断你。
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-xl text-[#a1a1a6] max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Polite chatbots nod along to your fluff. Real FAANG interviewers and VC partners cut you off in 12 seconds when you ramble. HardCall trains your voice composure under 52ms real-time interruptions, with rich question banks for interviews & keynote speeches."
              : "礼貌的 AI 对你的套话点头称赞；但现实中大厂面试官与投资人在你废话超过 15 秒时会毫不留情打断你。HardCall 带来高压语音全双工实战，覆盖行为面试、系统架构、薪资谈判与演讲路演全量题库。"}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#pricing"
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center gap-2 transition-transform active:scale-95"
            >
              <Apple className="w-4 h-4 fill-current" />
              <span>{isEn ? "Get on App Store ($6.99/wk)" : "App Store 获取 ($6.99/周起)"}</span>
            </a>

            <a
              href="#simulator"
              className="px-6 py-3 rounded-full border border-white/20 hover:border-white/40 text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? "Try Voice Mic Simulator" : "在线体验麦克风语音对练"}</span>
            </a>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#86868b] font-mono">
            <span>✓ Hands-Free AirPods Mic Support</span>
            <span>✓ Structured LeetCode-Style Question Bank</span>
            <span>✓ Pitch & Presentation Filler Radar</span>
          </div>
        </div>
      </section>

      {/* 题库分类与选择区 (LeetCode 风格结构化题库) */}
      <section id="bank" className="py-14 px-4 sm:px-8 border-b border-white/10 bg-[#0d0e13]">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
                {isEn ? "STRUCTURED DRILL BANK" : "高频结构化题库目录"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isEn ? "Choose your topic. Face the fire." : "自由选择专题，靶向击破弱点。"}
              </h2>
            </div>
            <div className="text-xs text-[#a1a1a6]">
              {isEn ? "Supports Custom JD / Slide Notes Upload" : "支持自定义粘贴职位要求或 PPT 演说提纲"}
            </div>
          </div>

          {/* 4 大分类胶囊切换 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "behavioral", label: isEn ? "1. Behavioral (FAANG)" : "1. 行为与领导力", icon: Star },
              { id: "systemDesign", label: isEn ? "2. System Design" : "2. 架构与容灾答辩", icon: Layers },
              { id: "salaryNegotiation", label: isEn ? "3. Salary Pushback" : "3. 薪酬与期权谈判", icon: Zap },
              { id: "presentationPitch", label: isEn ? "4. Pitch & Keynote" : "4. 演说与路演答辩", icon: Mic },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as DrillCategory);
                    const matched = QUESTION_BANK.filter((q) => q.category === cat.id);
                    if (matched.length > 0) {
                      setSelectedQuestion(matched[0]);
                      setCallStatus("idle");
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    active
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-[#14161f] border-white/10 text-[#a1a1a6] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 当前分类下的精选题单列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {filteredQuestions.map((q) => {
              const isSelected = selectedQuestion.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setCallStatus("idle");
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#181b26] border-emerald-500/80 shadow-md"
                      : "bg-[#121319] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {isEn ? q.categoryName : q.categoryNameZh}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {isEn ? q.title : q.titleZh}
                  </h4>
                  <p className="text-xs text-[#a1a1a6]">{q.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 核心工作台：在线实机语音麦克风对练 */}
      <section id="simulator" className="py-20 px-4 sm:px-8 bg-[#f5f5f7] text-[#111215]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold mb-2">
                {isEn ? "LIVE VOICE SIMULATOR WITH AIRPODS / MIC" : "在线双向全语音实测（支持直接用麦克风说话）"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {isEn ? "Face the interviewer with your real voice." : "用真实的声音，开麦迎战考官。"}
              </h2>
            </div>
            <div className="text-xs text-[#515154] font-mono">
              {isEn ? "Current Topic: " : "当前挑战："}
              <span className="font-bold text-black">{isEn ? selectedQuestion.title : selectedQuestion.titleZh}</span>
            </div>
          </div>

          {/* 拟真电话控制台 */}
          <div className="rounded-3xl bg-white border border-black/10 shadow-2xl overflow-hidden">
            {/* 顶部通话状态条 */}
            <div className="px-6 py-4 bg-[#ececf0] border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#111215]">
                  {callStatus === "idle"
                    ? isEn
                      ? "STANDBY · READY TO DIAL"
                      : "就绪待拨打"
                    : callStatus === "ringing"
                    ? isEn
                      ? "CONNECTING DRILL..."
                      : "连线响铃中..."
                    : callStatus === "active"
                    ? `LIVE DRILL · ${formatTime(elapsed)}`
                    : isEn
                      ? "DRILL COMPLETED · SCORECARD READY"
                      : "演练结束 · 体检报告已就绪"}
                </span>
              </div>

              {callStatus === "active" && (
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono">
                    <span className="text-[#515154]">{isEn ? "Fillers: " : "口癖数："}</span>
                    <span className={`font-bold ${totalFillers > 2 ? "text-orange-600" : "text-emerald-700"}`}>
                      {totalFillers}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#515154] font-medium hidden sm:inline">
                      {isEn ? "Skepticism:" : "考官疑虑："}
                    </span>
                    <div className="w-20 sm:w-28 h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          skepticism > 65 ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${skepticism}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        skepticism > 65 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {skepticism}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 电话状态 1: 待拨打 (Idle) */}
            {callStatus === "idle" && (
              <div className="p-10 sm:p-14 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  <Phone className="w-9 h-9" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl font-bold text-[#111215]">
                    {isEn ? `Ready for "${selectedQuestion.title}"?` : `准备好挑战「${selectedQuestion.titleZh}」了吗？`}
                  </h3>
                  <p className="text-sm text-[#515154] leading-relaxed">
                    {isEn
                      ? `Interviewer: ${selectedQuestion.role}. Speak clearly using your microphone. If you ramble or lack hard metrics, expect an aggressive 52ms interruption.`
                      : `考官：${selectedQuestion.role}。点击拨打后可直接开麦语音说话，一旦出现含糊套话或缺少数据，考官将在 52 毫秒内当场打断你。`}
                  </p>
                </div>
                <button
                  onClick={handleStartCall}
                  className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isEn ? "Start Live Voice Drill" : "拨打语音对练电话"}</span>
                </button>
              </div>
            )}

            {/* 电话状态 2: 响铃中 (Ringing) */}
            {callStatus === "ringing" && (
              <div className="p-10 sm:p-14 text-center space-y-6 bg-[#111215] text-white">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  {isEn ? "INCOMING HIGH-STAKES DRILL" : "高压连线中"}
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold">{selectedQuestion.title}</h3>
                  <p className="text-sm text-[#a1a1a6]">{selectedQuestion.role}</p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4">
                  <button
                    onClick={() => setCallStatus("idle")}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-90"
                    title={isEn ? "Decline" : "取消"}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="px-8 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95 animate-bounce"
                  >
                    <Phone className="w-5 h-5 fill-current" />
                    <span>{isEn ? "Accept & Listen" : "接听并开麦"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 电话状态 3: 通话中 (Active) */}
            {callStatus === "active" && (
              <div className="p-6 sm:p-8 space-y-6">
                {/* 抢话打断闪红视觉 */}
                {isInterrupting && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500 text-red-700 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      {isEn
                        ? "⚡ 52ms REAL-TIME BARGE-IN TRIGGERED: VAGUE RAMBLING DETECTED"
                        : "⚡ 52ms 毫秒级抢话打断：检测到口癖套话与缺乏个人量化产出！"}
                    </span>
                  </div>
                )}

                {/* 对话流记录 */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {transcript.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                        t.isInterrupt
                          ? "bg-red-50 border-red-200 text-red-950 font-semibold"
                          : t.speaker.includes("You")
                          ? "bg-blue-50 border-blue-200 text-blue-950 ml-6"
                          : "bg-[#f5f5f7] border-black/5 text-[#111215]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1 font-bold">
                        <span
                          className={
                            t.isInterrupt
                              ? "text-red-700"
                              : t.speaker.includes("You")
                              ? "text-blue-700"
                              : "text-[#515154]"
                          }
                        >
                          {t.speaker}
                        </span>
                      </div>
                      <div>{t.text}</div>
                      {t.note && (
                        <div className="mt-2 text-xs font-mono font-medium text-amber-700 bg-amber-100/60 p-2 rounded-lg">
                          {t.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 真实麦克风录音控制 + 快速回答预设 */}
                <div className="p-4 rounded-2xl bg-[#ececf0] border border-black/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[#515154] uppercase tracking-wider flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? "Speech Voice Input:" : "麦克风开麦说话："}</span>
                    </div>

                    {/* 录音按钮 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleRecording}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isRecording
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>
                          {isRecording
                            ? isEn
                              ? "Listening... Tap to Submit"
                              : "正在收音中... 点击提交"
                            : isEn
                            ? "Click to Speak Live"
                            : "点击开麦说话"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 也可以点击预设回答直接试玩 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRespond(selectedQuestion.weakSample)}
                      className="p-3 text-left rounded-xl bg-white hover:bg-amber-50 border border-black/10 hover:border-amber-300 transition-colors text-xs text-[#111215] cursor-pointer"
                    >
                      <span className="font-bold text-amber-700 block mb-0.5">
                        {isEn ? "1. Fluff Answer (Triggers 52ms Barge-In)" : "1. 虚浮套话回答（触发 52ms 抢话打断）"}
                      </span>
                      <span className="text-[#515154] line-clamp-2">"{selectedQuestion.weakSample}"</span>
                    </button>

                    <button
                      onClick={() => handleRespond(selectedQuestion.strongSample)}
                      className="p-3 text-left rounded-xl bg-white hover:bg-emerald-50 border border-black/10 hover:border-emerald-300 transition-colors text-xs text-[#111215] cursor-pointer"
                    >
                      <span className="font-bold text-emerald-700 block mb-0.5">
                        {isEn ? "2. Metric Answer (Passes Grill)" : "2. 硬核量化回答（通过考核）"}
                      </span>
                      <span className="text-[#515154] line-clamp-2">"{selectedQuestion.strongSample}"</span>
                    </button>
                  </div>

                  {/* 文字微调或提交 */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder={
                        isEn
                          ? "Voice transcript appears here, or type directly..."
                          : "麦克风语音转录文字将显示在这里，也可直接打字..."
                      }
                      value={userCustomInput}
                      onChange={(e) => setUserCustomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRespond(userCustomInput);
                      }}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-black/15 bg-white text-[#111215] focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleRespond(userCustomInput)}
                      className="px-4 py-2 rounded-xl bg-[#111215] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                    >
                      {isEn ? "Submit" : "发送回答"}
                    </button>
                    <button
                      onClick={handleEndCall}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isEn ? "End & Score" : "挂断并评分"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 电话状态 4: 挂断出体检单 (Ended) */}
            {callStatus === "ended" && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                      {isEn ? "POST-CALL AUTOPSY & PACING RADAR" : "语音演练战后体检单"}
                    </span>
                    <h3 className="text-2xl font-bold text-[#111215]">
                      {isEn ? "Hiring & Presentation Verdict" : "面试官与演说委员会综合评级"}
                    </h3>
                  </div>
                  <button
                    onClick={handleStartCall}
                    className="px-4 py-2 rounded-full bg-[#111215] hover:bg-black text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{isEn ? "Redial & Try Again" : "重新拨打挑战"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">OFFER READINESS</div>
                    <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">86/100</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">COMPOSURE SCORE</div>
                    <div className="text-2xl font-bold text-blue-600 font-mono mt-1">82%</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">TOTAL FILLER WORDS</div>
                    <div className="text-2xl font-bold text-amber-600 font-mono mt-1">{totalFillers}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
                    <div className="text-[11px] font-mono text-[#515154] font-bold">SKEPTICISM LEVEL</div>
                    <div className="text-2xl font-bold text-[#111215] font-mono mt-1">{skepticism}%</div>
                  </div>
                </div>

                {/* 口癖雷达统计细项 */}
                <div className="p-4 rounded-2xl bg-[#ececf0] border border-black/10">
                  <div className="text-xs font-bold text-[#111215] mb-2 uppercase tracking-wider">
                    {isEn ? "Filler Word Breakdown (Pacing Radar):" : "口癖频次分布雷达："}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-mono">
                    {Object.entries(fillerCounts).map(([k, v]) => (
                      <div key={k} className="px-3 py-1 rounded-lg bg-white border border-black/10">
                        <span className="text-[#515154]">{k}: </span>
                        <span className={`font-bold ${v > 0 ? "text-orange-600" : "text-emerald-700"}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 逐句满分改写范本 */}
                <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/10 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#111215] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? "Executive Rewrite Comparison" : "高管级确定性话术改写升级"}</span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                      <div className="text-[11px] font-mono font-bold text-red-700 mb-1">
                        ✗ {isEn ? "WHAT TRIGGERED INTERRUPTION OR SOUNDED VAGUE:" : "引起考官不耐烦的弱点回答："}
                      </div>
                      <div className="text-red-950 font-normal">"{selectedQuestion.weakSample}"</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
                      <div className="text-[11px] font-mono font-bold text-emerald-800 mb-1">
                        ✓ {isEn ? "EXECUTIVE HIGH-CONVICTION REWRITE:" : "高管级确定性话术改写："}
                      </div>
                      <div className="text-emerald-950 font-semibold">{selectedQuestion.rewrite}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 演讲与路演实操专区介绍 */}
      <section id="presentation" className="py-16 px-4 sm:px-8 border-b border-white/10 bg-[#0d0e13]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              {isEn ? "KEYNOTE, PITCH & DEFENSE STUDIO" : "演说路演与高管答辩专区"}
            </span>
            <h2 className="text-3xl font-bold text-white">
              {isEn ? "Practice your high-stakes presentation." : "告别口癖与超时，掌控每一次高光演讲。"}
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1a6]">
              {isEn
                ? "Simulate aggressive investor interruptions during YC pitches, or eliminate 'like' / 'you know' filler habits before keynotes."
                : "模拟投资人在 Demo Day 随时尖锐打断，或在大型峰会演说前纠正无意识口癖与节奏失控。"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#14161f] border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="text-sm font-bold text-white">
                {isEn ? "YC Demo Day Pitch Grill" : "YC 2分钟商业路演抗压"}
              </h4>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Simulates impatient partners cutting off background slides to demand paying customer traction."
                  : "模拟不耐烦的合伙人打断冗长背景，逼问真实付费用户与商业壁垒。"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#14161f] border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="text-sm font-bold text-white">
                {isEn ? "Architecture Review Defense" : "企业架构评审与晋升述职"}
              </h4>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Practice defending technical trade-offs, p99 latency regressions, and cloud cost ROI to principal engineers."
                  : "练习向首席架构师与评审委员会清晰论证架构取舍与高可用方案。"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#14161f] border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="text-sm font-bold text-white">
                {isEn ? "Filler Word Autopsy Radar" : "口癖清洗与控时复盘雷达"}
              </h4>
              <p className="text-xs text-[#a1a1a6] leading-relaxed">
                {isEn
                  ? "Accurately detects 'um', 'like', and 'you know' in real-time, enforcing executive brevity."
                  : "毫秒级捕捉并高亮每一处口头禅与语速突变，打造高管级沉稳从容气场。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 与 GitHub 语音底座的关系架构 */}
      <section id="architecture" className="py-16 px-4 sm:px-8 border-b border-white/10 bg-[#08080a]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
                {isEn ? "HYBRID AUDIO RUNTIME" : "双模语音运行架构"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isEn ? "Local-First Privacy + Cloud Voice Gateway" : "本地隐私优先 + 云端语音网关底座"}
              </h2>
            </div>
            <div className="text-xs text-[#a1a1a6] font-mono">
              Powered by <span className="text-white font-bold">voice-agent-rtp-gateway</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#12141a] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                <Apple className="w-4 h-4" />
                <span>{isEn ? "CLIENT LAYER: APPLE ON-DEVICE ENGINE" : "客户端层：苹果本地免运维引擎"}</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#a1a1a6]">
                <li>• <b>Swift 6 + SFSpeechRecognizer</b>：音频在 Mac/iPhone 芯片本地毫秒级听写，无云端音频存储风险。</li>
                <li>• <b>AVSpeechSynthesizer</b>：超拟真原生美式发音，零服务器开销与流量费。</li>
                <li>• <b>零边际成本</b>：个人开发者无需维护昂贵 GPU 集群，纯享被动睡后收入。</li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#14161f] border border-emerald-500/40 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                <Server className="w-4 h-4" />
                <span>{isEn ? "ENTERPRISE LAYER: RTP / WEBRTC GATEWAY" : "企业级网关：voice-agent-rtp-gateway"}</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#f5f5f7]">
                <li>• <b>SIP / RTP 电话拨号仿真</b>：支持拨通真实手机与 PSTN 线路进行真人电话对练。</li>
                <li>• <b>8kHz G.711 声学失真</b>：模拟真实手机通话丢包与地铁背景杂音。</li>
                <li>• <b>ReAct 大模型考官大脑</b>：支持灵活接入自定义大模型生成动态连环追问。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 定价转化区 (StoreKit 2 冲刺定价) */}
      <section id="pricing" className="py-20 px-4 sm:px-8 bg-[#0b0c10]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
            {isEn ? "PRICING DESIGNED FOR SPRINT SUCCESS" : "为求职冲刺量身打造的透明定价"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            {isEn ? "One offer pays this back 2,500x over." : "拿到一个高薪 Offer，ROI 超过 2,500 倍。"}
          </h2>
          <p className="text-sm sm:text-base text-[#a1a1a6] max-w-lg mx-auto">
            {isEn
              ? "Available directly in the Apple App Store. Manage and cancel anytime via Apple ID."
              : "完全通过 Apple App Store 官方安全结算，随时在 Apple ID 中管理或取消。"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 text-left">
            {/* 方案 1: 周度冲刺卡 */}
            <div className="p-8 rounded-3xl bg-[#12141a] border-2 border-emerald-500 space-y-6 relative">
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-bold uppercase">
                {isEn ? "Most Popular" : "冲刺首选"}
              </span>
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  {isEn ? "INTERVIEW SPRINT PASS" : "求职冲刺周卡"}
                </div>
                <div className="text-4xl font-bold text-white mt-2">
                  $6.99 <span className="text-base font-normal text-[#a1a1a6]">{isEn ? "/ week" : "/ 周"}</span>
                </div>
                <p className="text-xs text-[#a1a1a6] mt-2">
                  {isEn
                    ? "Ideal for your 2-to-4 week active interview sprint. Unlimited mock grilling across all 4 categories."
                    : "适合 2~4 周的集中面试冲刺期，无限次对练行为、架构、薪资与演讲题库。"}
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-[#d1d1d6]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isEn ? "Unlimited mock calls across all categories" : "全量畅享行为、架构、薪资与路演题库"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isEn ? "Real-time mic speech input & filler analytics" : "实时麦克风收音与口癖词频雷达监控"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isEn ? "Full post-call autopsy and $200K script rewrites" : "完整生成战后体检单与高管级话术改写"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isEn ? "Cancel anytime in Apple ID Settings" : "随时可在苹果系统设置中一键取消续费"}</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  setCheckoutPlan("weekly");
                  setShowCheckoutModal(true);
                }}
                className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm text-center transition-all cursor-pointer shadow-lg active:scale-95"
              >
                {isEn ? "Start Weekly Sprint ($6.99)" : "开启每周冲刺 ($6.99/周)"}
              </button>
            </div>

            {/* 方案 2: 终身买断卡 */}
            <div className="p-8 rounded-3xl bg-[#12141a] border border-white/10 space-y-6">
              <div>
                <div className="text-xs font-mono font-bold text-blue-400 uppercase">
                  {isEn ? "LIFETIME OFFER PASS" : "终身买断通行证"}
                </div>
                <div className="text-4xl font-bold text-white mt-2">
                  $49.99 <span className="text-base font-normal text-[#a1a1a6]">{isEn ? "one-time" : "一次付清"}</span>
                </div>
                <p className="text-xs text-[#a1a1a6] mt-2">
                  {isEn
                    ? "Pay once, own forever. Perfect for serial negotiators, executives & consultants."
                    : "一次购买，终生使用。适合常态化商务谈判、述职答辩与演讲路演。"}
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-[#d1d1d6]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{isEn ? "Universal access on iPhone, iPad and Mac" : "支持 iPhone / iPad / Mac 多端云同步"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{isEn ? "Lifetime updates to all future persona & drill packs" : "终身免费升级未来所有考官与演说题库"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{isEn ? "Zero recurring subscriptions" : "无任何月度或年度自动续费"}</span>
                </li>
              </ul>

              <button
                onClick={() => {
                  setCheckoutPlan("lifetime");
                  setShowCheckoutModal(true);
                }}
                className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm text-center transition-all cursor-pointer"
              >
                {isEn ? "Buy Lifetime Pass ($49.99)" : "一次性买断 ($49.99)"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 苹果 App Store 强制合规区 (Guideline 5.1.1 隐私 + 3.1.2 条款 + 支持) */}
      <footer id="compliance" className="border-t border-white/10 bg-[#060709] py-14 px-4 sm:px-8 text-xs text-[#86868b] leading-relaxed">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-2">Privacy Policy (Guideline 5.1.1)</h4>
              <p>
                HardCall processes all user voice inputs locally and ephemerally. Audio recordings are strictly used for live barge-in interruption detection and post-call feedback generation. We never sell, store permanently, or transmit raw audio to third parties.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Terms & Auto-Renewal (Guideline 3.1.2)</h4>
              <p>
                Subscription ($6.99/week) renews automatically unless auto-renew is cancelled at least 24 hours prior to the end of the current billing cycle in your Apple ID Settings. Governed by standard Apple EULA.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Support & Developer Contact</h4>
              <p>
                Developer: Wang Guo (@wangguode)<br />
                Support Email: <a href="mailto:17768113090@163.com" className="text-white underline">17768113090@163.com</a><br />
                Bundle ID: com.wangguo.hardcall<br />
                Primary Category: Education / Career Tools
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>Copyright © 2026 Wang Guo (17768113090@163.com). All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#compliance" className="hover:text-white">Privacy Policy</a>
              <a href="#compliance" className="hover:text-white">Terms of Use (EULA)</a>
              <a href="mailto:17768113090@163.com" className="hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 购买与兑换弹窗 */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12141a] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {checkoutPlan === "weekly"
                  ? isEn
                    ? "Unlock Weekly Sprint ($6.99)"
                    : "解锁每周冲刺通行证 ($6.99/周)"
                  : isEn
                  ? "Unlock Lifetime Offer Pass ($49.99)"
                  : "解锁终身买断通行证 ($49.99)"}
              </h3>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setPromoMessage("");
                }}
                className="text-[#a1a1a6] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#a1a1a6]">
              {isEn
                ? "This simulates the native StoreKit 2 in-app checkout modal on macOS & iOS. Payments are processed securely via Apple."
                : "此弹窗演示原生 macOS & iOS 上的 StoreKit 2 苹果官方内购流程，款项由苹果自动结算。"}
            </p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#a1a1a6]">{isEn ? "Item" : "项目"}</span>
                <span className="text-white font-mono">
                  {checkoutPlan === "weekly" ? "com.wangguo.hardcall.weekly" : "com.wangguo.hardcall.lifetime"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#a1a1a6]">{isEn ? "Price" : "价格"}</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {checkoutPlan === "weekly" ? "$6.99 / week" : "$49.99 once"}
                </span>
              </div>
            </div>

            {/* VIP 兑换码测试 */}
            <div className="space-y-2">
              <div className="text-xs text-[#a1a1a6] font-medium">
                {isEn ? "Have a VIP Promo Code?" : "拥有 VIP 免费通行码？"}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. HC-OFFER-2026"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white uppercase font-mono"
                />
                <button
                  onClick={handleRedeemPromo}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold"
                >
                  {isEn ? "Redeem" : "兑换"}
                </button>
              </div>
              {promoMessage && (
                <div className="text-xs font-mono text-emerald-400">{promoMessage}</div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/Users/wangguo/Downloads/HardCall-AppStore.dmg"
                download
                className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs text-center block"
              >
                {isEn ? "Download macOS App (.dmg)" : "直接下载体验 macOS App (.dmg)"}
              </a>
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setPromoMessage("");
                }}
                className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs text-center block"
              >
                {isEn ? "Close" : "关闭"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
