<div align="center">

# 🎙️ HardCall RTP // 52ms 电信级 8kHz PSTN/SIP 全双工语音打断网关与压测实验室
### 终结 900ms+ WebSocket 尾音抢话碰撞 · 51.96ms P95 毫秒级确定性截断架构

[![在线声波对比](https://img.shields.io/badge/在线压测台-hardcall.statementflow.win-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://hardcall.statementflow.win)
[![RTP 开源实验室](https://img.shields.io/badge/8kHz_RTP_参考实现-ai--agent--voice-10B981?style=flat-square)](https://github.com/wangguode/ai-agent-voice/tree/main/01-voice-agent-rtp-bargein)
[![P95 截断延迟](https://img.shields.io/badge/P95_打断延迟-51.96ms-EF4444?style=flat-square)](https://hardcall.statementflow.win/#enterprise-b2b)

[🇺🇸 English](./README.md) | **🇨🇳 简体中文** · [🌐 在线 52ms vs 920ms 声波对比](https://hardcall.statementflow.win) · [☎️ 8kHz RTP 开源参考库](https://github.com/wangguode/ai-agent-voice/tree/main/01-voice-agent-rtp-bargein)

</div>

---

## 1. 为什么常规 WebSocket 语音 Agent 一上真实电话线就被挂断？

常规语音 AI 封装在 TCP/WebSocket 上预缓冲数十个 TTS 音频分片。当车险报案客户、急诊分诊患者或银行持卡人在播报中途开口插话时：
1. **900ms+ 尾音抢话碰撞**：TCP 队头阻塞与出站缓冲未及时排空，导致 AI 继续压着客户说话近 1 秒，引发客户烦躁挂机。
2. **8kHz G.711 线性重采样混叠失真**：窄带电话 `8kHz` 粗糙上采样至 `16kHz` 会造成高频混叠，导致抢话期间保单号、邮编与金额数字识别错误率飙升。
3. **背景咳嗽/杂音误打断**：单层阈值 VAD 遇到轻微咳嗽便整句掐断回复。

**HardCall RTP** 从传输层与音频 DSP 底层彻底根除上述瓶颈：
- **精确至 `51.96ms` 的五段帧预算**：`20.0ms` UDP/RTP (`ptime=20ms`) + `12.0ms` 自适应抖动缓冲 + `1.8ms` `libsoxr` VHQ 无损重采样 + `18.0ms` 本地 Silero Fast-VAD + `0.16ms` 256 帧出站环形缓冲区瞬时清零。
- **50ms / 200ms 双层声学语义防误触**：`50ms` 声学快停瞬间静音出站帧，`200ms` 语义确认门区分短暂咳嗽与真实插话。
- **100% 企业自有 VPC 零外泄运行**：直接对接 FreeSWITCH / Asterisk / Twilio Elastic SIP / Telnyx，通话音频永不经过第三方中转服务器。

---

## 2. 企业级工程服务阶梯报价（Creem.io 全球合规收单）

- **`$299` — 48 小时线上语音延迟体检与改造方案**：实测贵司线上 SIP 号码或 WebRTC 节点，48 小时内交付逐帧 RTP/VAD/TTS 火焰图诊断书与补丁路线图（**SLA 承诺：未能定位 ≥40% 延迟降幅无条件全额退款；30 天内升级 `$1,200` 部署包可 100% 全额抵扣**）。
- **`$1,200` — 8kHz RTP 网关源码与 Docker 私有化部署包**：含多并发 FreeSWITCH `ptime=20ms` + `libsoxr` VHQ 生产级容器栈、256 帧无锁语音环源码、永久商业 VPC 授权与 2 小时架构师实机联调。
- **`$3,000+` — 企业定制 SIP 集群与高并发交付**：200+ 并发通道压测调优与 30 天专属技术支持。
- **商务联系**：`hello@statementflow.win`

---

## 3. 本地开发与 Cloudflare Workers 部署

```bash
npm install
npm run dev
npm run build && npx wrangler deploy
```
