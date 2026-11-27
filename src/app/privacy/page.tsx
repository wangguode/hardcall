import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            Privacy Policy &amp; B2B Data Processing Disclosure
          </h1>
          <p className="text-sm text-[#a1a1a6]">
            Effective Date: November 27, 2026 · Controller: Wang Guo (HardCall Voice Architecture) ·
            Website: https://hardcall.statementflow.win
          </p>
        </div>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            1. Browser WebAudio Sandbox (Zero Microphone Audio Upload)
          </h2>
          <p>
            When you enable microphone input inside the HardCall Full-Duplex
            Barge-In Lab on <code>hardcall.statementflow.win</code>, your browser
            processes microphone PCM frames strictly in local memory via the Web
            Audio API (<code>AudioContext</code> + <code>AnalyserNode</code>) to
            compute real-time RMS acoustic energy and trigger local speech-onset
            cutoff timing (51.96ms Raw RTP mode vs. 920ms WebSocket mode).
          </p>
          <p>
            <strong>Zero voice recordings or raw audio buffers are ever uploaded to HardCall servers</strong>{" "}
            from the browser sandbox. Benchmark timing runs saved in the sandbox
            are stored locally in your browser&apos;s{" "}
            <code>localStorage</code> (<code>hardcall_bench_runs_v1</code>) and
            can be cleared by you with one click at any time.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            2. B2B Records &amp; Edge Telemetry Stored in Cloudflare D1
          </h2>
          <p>
            To fulfill commercial engagements, deliver sample traces, and monitor
            service reliability, our Cloudflare Workers backend stores minimal
            structured records in Cloudflare D1:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Commercial Orders (<code>hc_orders</code>):</strong>{" "}
              Checkout and order identifiers (<code>order_id</code>,{" "}
              <code>order_ref</code>), customer work email, purchased tier (
              <code>audit</code> or <code>kit</code>), USD amount, payment status,
              optional telephony stack note, and an activation{" "}
              <code>restore_token</code>.
            </li>
            <li>
              <strong>Pre-Sales Spot-Check &amp; Invoice Leads (<code>hc_leads</code>):</strong>{" "}
              Work email, submitted test phone number / SIP URI / telephony stack
              summary, optional engineering notes, and coarse 2-letter ISO
              country header (<code>cf-ipcountry</code>) when you submit the
              lead-capture or invoice request form.
            </li>
            <li>
              <strong>Paid Kickoff Intake (<code>hc_intake_submissions</code>):</strong>{" "}
              Verified order reference, work email, designated test SIP/WebRTC
              endpoint or GitHub username (for private repository provisioning),
              and pipeline latency notes submitted via{" "}
              <code>/api/b2b-intake</code>.
            </li>
            <li>
              <strong>First-Party Funnel Telemetry (<code>hc_funnel_events</code> &amp; <code>pixel.js</code>):</strong>{" "}
              Aggregate product interaction events (such as{" "}
              <code>page_view</code>, <code>sim_start</code>,{" "}
              <code>checkout_start</code>, and <code>b2b_lead_capture</code>)
              with coarse country code and truncated HTTP referrer, plus our
              first-party conversion measurement script (
              <code>https://pulse.statementflow.win/api/pixel.js</code>). We do
              not use third-party ad-network trackers, cross-site behavioral
              profiling cookies, or sell customer data to brokers.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            3. Self-Hosted VPC Zero Audio Egress
          </h2>
          <p>
            Production deployments of the <strong>$1,200 HardCall 8kHz RTP Self-Hosted Deployment Kit</strong>{" "}
            execute 100% inside your own AWS, GCP, Azure, or bare-metal VPC
            alongside your FreeSWITCH / SIP infrastructure. The kit contains{" "}
            <strong>zero phone-home telemetry, zero external license callouts, and zero audio or SIP signaling egress</strong>{" "}
            to HardCall, supporting your internal HIPAA, SOC 2, and PCI-DSS
            isolation boundaries.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            4. Sub-Processors (Creem.io, Cloudflare, Resend)
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Creem.io (Merchant of Record):</strong> Processes credit
              cards, billing addresses, and corporate tax/VAT receipts directly
              under PCI-DSS compliance; HardCall never sees or stores payment
              card numbers.
            </li>
            <li>
              <strong>Cloudflare Workers &amp; D1:</strong> Hosts static assets,
              edge rate-limiting (ephemeral in-memory IP counters reset every 60
              seconds), and encrypted-at-rest D1 tables described in Section 2.
            </li>
            <li>
              <strong>Resend:</strong> Delivers transactional kickoff links,
              order confirmations, and requested RTP diagnostic traces to your
              work email.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            5. Data Retention &amp; Deletion Rights (GDPR / CCPA)
          </h2>
          <p>
            Diagnostic call traces captured during a 48h SIP/WebRTC Latency Audit
            are used solely to produce your engineering report and are purged
            within 30 days of engagement completion (or immediately upon written
            request). You may request access, export, correction, or deletion of
            any lead, intake, or non-statutory order metadata associated with
            your email address by contacting{" "}
            <a
              href="mailto:hello@statementflow.win"
              className="text-emerald-400 underline"
            >
              hello@statementflow.win
            </a>{" "}
            (fulfilled within 7 business days).
          </p>
        </section>
      </div>
    </main>
  );
}
