<div align="center">

# 🎙️ HardCall // 52ms 毫秒级实时打断 AI 高压语音面试与演说路演模拟器
### (ChatGPT Is Polite. Real Interviewers Interrupt — High-Pressure AI Voice Simulator)

[![Cloudflare Pages](https://img.shields.io/badge/Live_Demo-Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://hardcall.153557421.workers.dev)
[![Zhihu](https://img.shields.io/badge/知乎-@王果ai_(1.2w+_关注)-0084FF?style=flat-square&logo=zhihu&logoColor=white)](https://www.zhihu.com/people/wang-guo-ha-53)
[![Swift 6](https://img.shields.io/badge/Native_Client-Swift_6_+_Speech-FA7343?style=flat-square&logo=swift&logoColor=white)](https://github.com/wangguode/hardcall)
[![Next.js 16](https://img.shields.io/badge/Web_Studio-Next.js_16_Static-000000?style=flat-square&logo=next.js&logoColor=white)](https://hardcall.153557421.workers.dev)
[![Barge-In](https://img.shields.io/badge/Barge--In_Latency-52ms-EF4444?style=flat-square)](https://github.com/wangguode/ai-agent-voice)

[🌐 在线体验 (Live Web Demo)](https://hardcall.153557421.workers.dev) · [📖 知乎专栏 (@王果ai)](https://www.zhihu.com/people/wang-guo-ha-53) · [🧠 AI Agent 与语音工程知识库](https://github.com/wangguode/ai-agent-voice) · [🧩 知枢智能体 (Zhishu Agent)](https://github.com/wangguode/zhishu-agent)

</div>

---

## 1. 为什么做这个项目？（核心痛点破局）

市面上普通的 AI 聊天机器人（如默认模式下的 ChatGPT）**过于礼貌**——当你用大量的口头禅（`um`、`like`、`那个`、`然后`）啰嗦铺垫 3 分钟却没有任何量化指标时，它依然会耐心地听完并夸奖你。

但在真实的**大厂终面（FAANG Behavioral / System Design）**、**高管晋升答辩**或 **YC 投资人路演（Pitch）**中，只要你在前 12~15 秒内没有切入核心结论或缺乏数据支撑，考官和投资人会**毫不留情地直接开口打断你（Barge-In）**。

**HardCall** 专为“高压实时语音对抗”而生：
- **52ms 毫秒级实时抢话打断**：实时监测你的语音流与增量文本，一旦检测到口水话、逻辑发散或缺乏量化数据，立即在句中强行打断并发起尖锐追问。
- **双端同源架构（Web 在线舱 + Apple 原生客户端）**：既支持零门槛浏览器麦克风直连体验，又提供基于 `Swift 6 + AVAudioEngine + SFSpeechRecognizer` 的 macOS/iOS 原生客户端（支持 AirPods 免提对抗）。
- **LeetCode 式结构化题库**：内置大厂行为面试、高并发系统设计答辩、薪资谈判破局、演说与路演 4 大专项训练场。

---

## 2. 全栈系统架构图（双端语音舱 + 52ms 实时打断状态机）

<p align="center">
  <img src="./docs/assets/hardcall-architecture.svg" alt="HardCall Full-Stack Architecture" width="100%" />
</p>

### 实时语音打断（Barge-In）与多端协同数据流

```mermaid
flowchart TB
    subgraph Clients["多端实时语音交互层 (Multi-Platform Voice Clients)"]
        WebClient["🌐 Web 实时语音工作台\n(Next.js 16 + Web Speech API + 60FPS 声波环)"]
        AppleClient["🍎 Apple 原生客户端\n(Swift 6 + SwiftUI + AVAudioEngine + AirPods 免提)"]
        DeckPicker["📚 LeetCode 式 4 大结构化题库选择器\n(行为面试 / 系统设计 / 薪资谈判 / 演说路演)"]
    end

    subgraph BargeInKernel["52ms 毫秒级实时打断与压力状态机内核 (Barge-In & Pressure Kernel)"]
        StreamMonitor["① 实时语音流特征嗅探器\n(废话词 um/like/那个 · 量化指标缺失 · >15s 超时熔断)"]
        StateMachine["② 全双工打断状态机\n(IDLE ➔ LISTENING ➔ BARGE_IN ➔ SPEAKING)"]
        ClearAudio["③ 52ms 抢话截断控制器\n(挂起麦克风采集 + clearAudio 清空缓冲 + 零延迟切入)"]
        AutopsyEngine["④ 通话后尸检复盘引擎 (Post-Call Autopsy)\n(镇定度雷达 · 废话标红 · $200K+ 高管级重写对比)"]
    end

    subgraph Infrastructure["双模驱动底座 (Dual-Mode Voice Infrastructure)"]
        EdgeMode["⚡ 模式 A：轻量化边缘零成本直连\n(Cloudflare Workers 静态部署 · 浏览器原生语音引擎)"]
        EnterpriseGateway["🏢 模式 B：企业级 RTP 语音网关底座 (voice-agent-rtp-gateway)\n(FreeSWITCH 8kHz RTP + Pipecat 全双工管道 + SenseVoice 60ms 打断)"]
    end

    DeckPicker --> WebClient & AppleClient
    WebClient & AppleClient --> StreamMonitor
    StreamMonitor --> StateMachine --> ClearAudio --> AutopsyEngine
    StateMachine -.-> EdgeMode & EnterpriseGateway
```

### 界面实机预览 (Web & Desktop Studio)

<p align="center">
  <img src="./docs/assets/hardcall-preview.png" alt="HardCall Live Voice Studio Preview" width="100%" />
</p>

---

## 3. LeetCode 式 4 大结构化高压训练题库

| 题库分类 | 典型高压场景题目 | 考官打断触发条件 (Barge-In Triggers) |
| :--- | :--- | :--- |
| **01. 大厂行为面试**<br>*(FAANG Behavioral)* | • 生产环境 P0 级故障复盘与个人决策<br>• 与资深 Tech Lead 发生架构分歧时的推进 | 铺垫背景超过 15 秒未进入行动点、使用模糊词（“我们团队大概做了…”）、缺乏故障恢复时长（MTTR）量化指标 |
| **02. 系统设计答辩**<br>*(System Design Defense)* | • 80,000 QPS 支付网关幂等性与防重设计<br>• 第三方 Webhook 瞬时丢包与背压削峰 | 只背诵通用八股文（“加个 Redis 缓存”）、未说明分布式锁过期与脑裂边界、未给出延迟 P99 数字 |
| **03. 薪资与职级谈判**<br>*(Salary Negotiation)* | • 突破 $160K 薪资上限的筹码博弈<br>• 无競对 Offer 时的股票/签字费谈判 | 语气犹豫道歉（`I was hoping maybe...`）、自降底牌、用个人生活成本代替商业产出价值 |
| **04. 演说与路演训练**<br>*(Keynote & Pitch Drills)* | • YC Demo Day 120 秒极速电梯路演<br>• 面向 CTO 的季度核心架构演进汇报 | 前 10 秒未讲清产品一句话定位、滥用未定义的行话缩写、缺乏核心增长率或成本下降百分比 |

---

## 4. 快速启动与部署指南 (Quick Start & Deployment)

### 本地运行 Web 语音工作台

```bash
cd web
npm install
npm run dev
```
浏览器打开 `http://localhost:3000` 即可直接使用麦克风或文本模拟模式进行高压对练。

### Cloudflare Workers / Pages 部署配置

仓库已内置 `wrangler.json` 与静态导出配置（`output: 'export'`）：
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Node.js version**: `20+`
