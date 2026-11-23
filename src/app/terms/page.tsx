import Link from "next/link";

export default function TermsOfUsePage() {
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
            Terms of Use &amp; Acceptable Use Policy
          </h1>
          <p className="text-sm text-[#a1a1a6]">
            Effective Date: November 20, 2026 · Operator: Wang Guo (HardCall) ·
            Website: https://hardcall.statementflow.win
          </p>
        </div>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            1. Scope of Service
          </h2>
          <p>
            HardCall provides interactive AI voice interview drills, follow-up
            question generation, and post-call script rewrite coaching for
            career preparation, technical interviews, and executive
            communication training. By accessing or purchasing HardCall, you
            agree to these Terms of Use.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            2. Purchases, Billing &amp; Refunds
          </h2>
          <p>
            Online web purchases are processed by Creem.io as our authorized
            Merchant of Record. Commercial B2B engagements include the Voice
            Latency Audit Pilot ($299 one-time), Self-Hosted 8kHz RTP
            Deployment Kit ($1,200 license), and Custom Enterprise Integrations
            ($3,000+), granting agreed software deliverables and engineering
            support. The web browser simulator is provided free of charge. If
            you experience technical issues or wish to request a refund within 7
            days of purchase, please email{" "}
            <a
              href="mailto:zhangsanx34@gmail.com"
              className="text-emerald-400 underline"
            >
              zhangsanx34@gmail.com
            </a>{" "}
            with your order reference.
          </p>
        </section>

        <section
          id="acceptable-use"
          className="space-y-3 text-sm text-[#d1d1d6] rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6"
        >
          <h2 className="text-lg font-semibold text-white">
            3. Acceptable Use Policy (Prohibited &amp; NSFW AI Content)
          </h2>
          <p>
            HardCall uses AI models strictly for professional interview
            practice, communication coaching, and script refinement. You agree{" "}
            <strong>NOT</strong> to use HardCall&apos;s AI follow-up question
            generation, voice interaction, or post-call rewrite features to
            generate, solicit, or distribute any prohibited content, including:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>NSFW, sexually explicit, or adult content</strong>,
              including erotic roleplay or non-consensual sexual material.
            </li>
            <li>
              <strong>Harassment, hate speech, violence, or self-harm</strong>{" "}
              promotion, threats, or abusive targeting of individuals or groups.
            </li>
            <li>
              <strong>Illegal, fraudulent, or deceptive activity</strong>,
              including impersonation, non-consensual voice cloning, phishing,
              or bypassing security controls.
            </li>
            <li>
              <strong>Automated abuse or scraping</strong> that attempts to
              reverse-engineer, overload, or extract underlying prompts or
              infrastructure.
            </li>
          </ul>
          <p>
            Violations of this Acceptable Use Policy may result in immediate
            access termination without refund and reporting where required by
            applicable law.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            4. Disclaimer &amp; Limitation of Liability
          </h2>
          <p>
            AI coaching feedback and generated follow-up questions are provided
            &ldquo;as is&rdquo; for educational practice only and do not
            guarantee specific hiring, compensation, or business outcomes. To
            the maximum extent permitted by law, HardCall&apos;s aggregate
            liability shall not exceed the amount you paid for the service in
            the preceding 12 months.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#d1d1d6]">
          <h2 className="text-lg font-semibold text-white">
            5. Support Contact
          </h2>
          <p>
            Questions regarding these Terms or Acceptable Use Policy may be sent
            to{" "}
            <a
              href="mailto:zhangsanx34@gmail.com"
              className="text-emerald-400 underline"
            >
              zhangsanx34@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
