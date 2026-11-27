<div align="center">

# 🎙️ HardCall RTP // 52ms 8kHz PSTN/SIP Voice Barge-In Gateway & Audio Lab
### Sub-60ms Full-Duplex Telephony Interruption Engine vs. 900ms+ WebSocket Wrapper Lag

[![Live Benchmark](https://img.shields.io/badge/Live_Audio_Lab-hardcall.statementflow.win-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://hardcall.statementflow.win)
[![RTP Reference](https://img.shields.io/badge/8kHz_RTP_Primitives-ai--agent--voice-10B981?style=flat-square)](https://github.com/wangguode/ai-agent-voice/tree/main/01-voice-agent-rtp-bargein)
[![Barge-In P95](https://img.shields.io/badge/P95_Cutoff_Latency-51.96ms-EF4444?style=flat-square)](https://hardcall.statementflow.win/#enterprise-b2b)
[![License](https://img.shields.io/badge/Sandbox_License-MIT-blue?style=flat-square)](./LICENSE)

**🇺🇸 English** | [🇨🇳 简体中文](./README.zh-CN.md) · [🌐 Live 52ms vs 920ms Audio Benchmark](https://hardcall.statementflow.win) · [☎️ Open-Source RTP Reference](https://github.com/wangguode/ai-agent-voice/tree/main/01-voice-agent-rtp-bargein)

</div>

---

## 1. Why WebSocket Voice Wrappers Fail on Real PSTN Phone Trunks

Standard voice AI stacks stream TTS audio over TCP/WebSockets with 40–60 buffered chunks in flight. When an impatient insurance policyholder, clinic patient, or banking caller interrupts mid-sentence:
1. **900ms+ Double-Talk Collision**: TCP head-of-line stalls and buffered WebSocket frames cause the bot to keep talking over the human caller for nearly a full second.
2. **8kHz G.711 Linear Resampling Aliasing**: Naive linear upsampling from narrowband `8kHz` PSTN audio to `16kHz` ASR degrades digit, zip-code, and name accuracy during double-talk.
3. **Transient Noise False Triggers**: Single-threshold VAD aborts whole TTS responses on background coughs or road noise.

**HardCall RTP** solves telephony turn-taking at the transport and DSP layer:
- **Exact `51.96ms` P95 Cutoff Budget**: `20.0ms` UDP/RTP (`ptime=20ms`) + `12.0ms` adaptive jitter buffer + `1.8ms` `libsoxr` VHQ lossless resampling + `18.0ms` local Silero Fast-VAD + `0.16ms` 256-frame outbound ring buffer teardown.
- **Two-Tier Acoustic + Semantic Guard**: `50ms` fast acoustic mute pauses outbound frames immediately while a `200ms` confirmation gate filters transient coughs from real caller speech.
- **100% Private VPC Execution**: Runs directly alongside FreeSWITCH / Asterisk / Twilio Elastic SIP / Telnyx inside your AWS or GCP VPC with zero third-party audio egress.

---

## 2. Interactive WebAudio Barge-In Lab (`hardcall.statementflow.win`)

Test directly in your browser with zero login or API keys:
- **A/B Waveform Proof**: Hear identical PSTN caller interruptions under `920ms` Legacy WebSocket buffering vs. `52ms` HardCall Raw RTP ring flush.
- **Live Microphone RMS VAD Sandbox**: Arm your real microphone (or trigger deterministic SIP frames) against an active 8kHz G.711 outbound voice stream and export JSON benchmark traces for your engineering team.

---

## 3. Commercial B2B Engineering Tiers (Creem.io MoR · Corporate VAT Invoices)

- **`$299` — 48h Voice Latency Audit & Flamegraph**: We dial and profile your live SIP number or WebRTC endpoint, delivering a stage-by-stage RTP/VAD/TTS overlap flamegraph and concrete patch roadmap within 48 hours (**SLA: ≥40% latency reduction identified or 100% full refund; 100% credited toward the `$1,200` Kit within 30 days**).
- **`$1,200` — Self-Hosted 8kHz RTP Gateway Deployment Kit**: Production multi-channel FreeSWITCH `ptime=20ms` + `libsoxr` VHQ Docker stack, 256-frame lock-free ring buffer source, perpetual commercial VPC license, and 2h live architect onboarding.
- **`$3,000+` — Custom Enterprise SIP Cluster & SOW**: Hands-on AWS/GCP VPC deployment, 200+ concurrent channel load tuning, and 30-day dedicated engineering support.
- **Contact**: `hello@statementflow.win`

---

## 4. Local Development & Cloudflare Workers Deployment

```bash
npm install
npm run dev
```

Build static assets and deploy with Wrangler:

```bash
npm run build
npx wrangler deploy
```

## License

Browser sandbox & UI licensed under **MIT** © 2026 Wang Guo (`@wangguode`).
