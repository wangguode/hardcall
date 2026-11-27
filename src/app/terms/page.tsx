import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Commercial Terms of Service & SLA | HardCall RTP",
  description:
    "B2B commercial terms, >=40% barge-in latency reduction refund SLA, $299-to-$1,200 credit policy, and acceptable telephony use policy for HardCall.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Commercial Terms of Service & SLA | HardCall RTP",
    description:
      "Commercial VPC licensing, 48h latency audit refund SLA, and acceptable telephony use policy.",
    url: "/terms",
    type: "website",
  },
};

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-[#08080a] text-[#f5f5f7] py-16 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8 leading-relaxed">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <Link
            href="/"
            className="text-xs font-mono text-emerald-400 hover:underline"
          >
            ← Back to HardCall RTP Infrastructure
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Commercial Terms of Service &amp; Acceptable Use Policy
          </h1>
          <p className="text-sm text-[#a1a1a6]">
            Effective Date: November 27, 2026 · Provider: Wang Guo (HardCall Voice Architecture) ·
            Website: https://hardcall.statementflow.win
          </p>
        </div>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            1. Scope of B2B Telephony Infrastructure &amp; Services
          </h2>
          <p>
            HardCall provides enterprise PSTN/SIP/WebRTC full-duplex voice
            interruption diagnostics, self-hosted 8kHz raw UDP/RTP media gateway
            software, FreeSWITCH packetization configurations, and turnkey
            telephony engineering engagements. We also provide a free browser-based
            WebAudio acoustic barge-in benchmark laboratory for technical
            evaluation. By accessing HardCall or purchasing any commercial tier,
            your organization agrees to these Terms.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            2. Commercial Engagement Tiers, SLAs &amp; Credit Policy
          </h2>
          <p>
            Online payments and corporate tax/VAT invoices are processed by{" "}
            <strong>Creem.io</strong> as our authorized Merchant of Record, or
            via direct B2B purchase order where agreed in writing:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Tier 1 — 48h SIP/WebRTC Voice Latency Audit ($299 one-time):</strong>{" "}
              Includes live dial/endpoint profiling of your designated test SIP
              URI, PSTN number, or WebRTC voice agent, a frame-by-frame
              RTP/jitter/resampler/VAD/TTS flamegraph, and a concrete patch
              blueprint delivered within 48 business hours of kickoff submission.{" "}
              <span className="text-emerald-300 font-medium">
                SLA &amp; Refund Guarantee:
              </span>{" "}
              If our audit does not identify actionable architectural changes
              yielding a <strong>&ge;40% reduction in end-to-end barge-in cutoff latency</strong>{" "}
              (when baseline cutoff exceeds 150ms), you are entitled to a{" "}
              <strong>100% full refund</strong> upon request within 14 days of
              report delivery. Furthermore, <strong>100% of your $299 Audit fee is creditable</strong>{" "}
              toward the $1,200 Self-Hosted Deployment Kit or a $3,000+ Custom
              Enterprise SOW within 30 calendar days of your audit purchase.
            </li>
            <li>
              <strong>Tier 2 — 8kHz Raw RTP Self-Hosted Deployment Kit ($1,200 one-time):</strong>{" "}
              Grants your organization a perpetual, non-exclusive,
              single-organization commercial license to deploy HardCall&apos;s
              FreeSWITCH <code>ptime=20ms</code> dialplan/profile stack,
              256-frame lock-free Go/Node UDP/RTP ring-buffer bridge,{" "}
              <code>libsoxr</code> VHQ <code>8kHz&rarr;16kHz</code> resampling
              pipeline, Docker Compose manifests, private GitHub repository
              updates, and one 2-hour live architect onboarding session across
              unlimited internal VPC nodes. Redistribution, public mirroring, or
              resale of the kit source code as a standalone competing SDK is
              prohibited.
            </li>
            <li>
              <strong>Tier 3 — Turnkey Enterprise SIP Cluster &amp; Custom SOW ($3,000+):</strong>{" "}
              Governed by a mutually executed Statement of Work (SOW) covering
              direct AWS/GCP/on-prem VPC deployment, 200+ concurrent SIP trunk
              load verification, custom two-tier acoustic/semantic VAD tuning,
              and 30-day dedicated engineering channel support.
            </li>
          </ul>
        </section>

        <section
          id="acceptable-use"
          className="space-y-3 text-sm text-[#d1d1d6] rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6"
        >
          <h2 className="text-lg font-semibold text-white">
            3. Acceptable Use &amp; Telecommunications Compliance Policy
          </h2>
          <p>
            HardCall software and diagnostic services are engineered strictly for
            lawful enterprise voice infrastructure. By submitting any SIP URI,
            PSTN telephone number, or WebRTC endpoint, or deploying the HardCall
            RTP Kit, you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Authorized Endpoints Only:</strong> You own or hold
              explicit written authorization to dial, load-test, and capture
              diagnostic latency traces on every telephone number, SIP trunk, or
              WebRTC endpoint submitted to HardCall.
            </li>
            <li>
              <strong>Telecom &amp; Robocall Compliance:</strong> You will not
              use HardCall software to originate unlawful automated calls, spam,
              caller-ID spoofing, phishing/vishing, or traffic violating the U.S.
              TCPA, FCC STIR/SHAKEN rules, EU ePrivacy Directive, or applicable
              carrier terms.
            </li>
            <li>
              <strong>No Emergency Service Disruption:</strong> You will never
              point HardCall test probes or unvalidated automated voice trunks at
              emergency PSAP numbers (e.g., 911, 112, 999) or critical life-safety
              lines.
            </li>
            <li>
              <strong>Infrastructure Integrity:</strong> You will not conduct
              SIP flood attacks, credential stuffing, unauthorized call
              interception, or abuse HardCall APIs beyond documented rate limits.
            </li>
          </ul>
          <p>
            Material violations of this Acceptable Use Policy may result in
            immediate suspension of diagnostic probes or repository access and
            reporting to relevant telecommunications authorities where required
            by law.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            4. Intellectual Property &amp; Open-Source Components
          </h2>
          <p>
            Public reference materials in our open GitHub laboratory remain
            licensed under the MIT License. Commercial kit deliverables, custom
            FreeSWITCH/RTP patches, and audit reports remain the intellectual
            property of HardCall, licensed to the purchasing organization for
            internal production and commercial voice product operation under
            Section 2. Customer retains 100% ownership of its own application
            code, prompts, SIP credentials, and VPC infrastructure.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            5. Warranties &amp; Limitation of Liability
          </h2>
          <p>
            Except for the express 48h Latency Audit SLA refund guarantee stated
            in Section 2, software and reference configurations are provided
            &ldquo;as is&rdquo; without implied warranties of uninterrupted
            carrier routing (which depends on upstream PSTN/SIP carriers and LLM
            / ASR third-party providers). To the maximum extent permitted by
            applicable law, HardCall&apos;s aggregate liability under these Terms
            shall not exceed the total fees paid by your organization to HardCall
            in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            6. Commercial Support &amp; Notices
          </h2>
          <p>
            For SLA refund claims, $299-to-$1,200 upgrade credit redemption,
            corporate invoicing, or procurement inquiries, contact{" "}
            <a
              href="mailto:hello@statementflow.win"
              className="text-emerald-400 underline"
            >
              hello@statementflow.win
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
