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
            ← Back to HardCall
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#a1a1a6]">
            Effective Date: November 20, 2026 · Operator: Wang Guo (HardCall) ·
            Website: https://hardcall.statementflow.win
          </p>
        </div>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            1. Information We Process
          </h2>
          <p>
            HardCall is an AI-powered voice interview drill simulator and
            coaching tool. When you run a voice drill session in your browser or
            native client, microphone audio and speech-to-text transcripts are
            processed ephemerally solely to evaluate pacing, filler words,
            barge-in interruption timing, and post-call coaching feedback.
          </p>
          <p>
            We do not sell personal data, rent user recordings, or permanently
            store raw voice audio on our servers.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            2. Payment &amp; Billing Data (Creem.io)
          </h2>
          <p>
            All paid purchases (Weekly Sprint Pass and Lifetime Offer Pass) are
            processed by our Merchant of Record, <strong>Creem.io</strong>.
            Credit card numbers, billing addresses, and tax invoices are
            collected and secured directly by Creem.io under their privacy and
            PCI-DSS compliance standards. HardCall receives only order status,
            plan tier, and customer email metadata via signed webhooks to unlock
            your access.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            3. Local Storage &amp; Telemetry
          </h2>
          <p>
            Session preferences, language selection, and local drill transcripts
            may be stored in your browser&apos;s localStorage for convenience.
            You may clear this data at any time through your browser settings.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            4. Your Rights &amp; Contact
          </h2>
          <p>
            You may request access, correction, or deletion of any account or
            order metadata associated with your email address at any time by
            contacting us at{" "}
            <a
              href="mailto:zhangsanx34@gmail.com"
              className="text-emerald-400 underline"
            >
              zhangsanx34@gmail.com
            </a>{" "}
            or{" "}
            <a
              href="mailto:17768113090@163.com"
              className="text-emerald-400 underline"
            >
              17768113090@163.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
