import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardcall.statementflow.win"),
  title: "HardCall — 52ms 8kHz Raw RTP Voice Barge-In Gateway & WebAudio Lab",
  description:
    "51.96ms (~52ms p95) PSTN/SIP full-duplex voice barge-in infrastructure: 20ms G.711 RTP + 12ms jitter buffer + 1.8ms libsoxr VHQ + 18ms Fast-Loop VAD + 0.16ms ring-buffer flush. Test live in browser or book a $299 48h SIP latency audit.",
  alternates: {
    canonical: "https://hardcall.statementflow.win",
  },
  openGraph: {
    title: "HardCall — 52ms 8kHz Raw RTP Voice Barge-In Infrastructure",
    description:
      "Eliminate 920ms+ WebSocket double-talk collisions on PSTN/SIP lines. Interactive WebAudio full-duplex lab + $299 48h SIP audit + $1,200 self-hosted FreeSWITCH RTP kit.",
    url: "https://hardcall.statementflow.win",
    siteName: "HardCall",
    images: [
      {
        url: "/og-hardcall.png",
        width: 1200,
        height: 630,
        alt: "HardCall 8kHz Raw RTP · 51.96ms (~52ms) Full-Duplex Barge-In vs 920ms WebSocket Lag",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HardCall — 52ms 8kHz Raw RTP Voice Barge-In Gateway",
    description:
      "51.96ms p95 PSTN/SIP barge-in cutoff vs 920ms WebSocket overlap. Interactive WebAudio lab + $299 48h latency audit + self-hosted VPC kit.",
    images: ["/og-hardcall.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const HARDCALL_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HardCall 8kHz Raw RTP Voice Barge-In Gateway",
    url: "https://hardcall.statementflow.win",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, Docker, FreeSWITCH, Web",
    description:
      "51.96ms p95 PSTN/SIP full-duplex voice interruption architecture (20.0ms 8kHz G.711 RTP + 12.0ms adaptive jitter buffer + 1.8ms libsoxr VHQ upsample + 18.0ms Fast-Loop VAD + 0.16ms 256-frame outbound ring-buffer flush).",
    offers: [
      {
        "@type": "Offer",
        name: "Interactive Browser WebAudio Barge-In Lab",
        price: "0.00",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "48h SIP/WebRTC Voice Latency Audit Pilot (100% Creditable Toward Kit)",
        price: "299.00",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "8kHz Raw RTP Self-Hosted Commercial Deployment Kit",
        price: "1200.00",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Turnkey Enterprise SIP Cluster & Custom SOW Integration",
        price: "3000.00",
        priceCurrency: "USD",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does HardCall achieve a 51.96ms (~52ms p95) barge-in cutoff vs 920ms+ on WebSocket wrappers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HardCall runs over raw UDP/RTP (ptime=20.0ms) with a 12.0ms adaptive carrier jitter buffer, 1.8ms libsoxr VHQ 8kHz-to-16kHz upsampling, an 18.0ms streaming Fast-Loop speech onset gate, and a 0.16ms lock-free 256-frame outbound ring-buffer flush — totaling 51.96ms end-to-end.",
        },
      },
      {
        "@type": "Question",
        name: "What is the difference between the open-source MIT demo and the $1,200 Self-Hosted Deployment Kit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The open-source MIT repository demonstrates single-stream loopback concepts, while the $1,200 Production Kit adds multi-tenant SIP ACL/auth, RFC2833 out-of-band DTMF interruption, lock-free Go/Node 256-frame UDP/RTP bridge source, Prometheus p95/p99 histograms, hardened FreeSWITCH ptime=20ms Docker Compose, perpetual VPC commercial licensing, and 2h live architect onboarding.",
        },
      },
      {
        "@type": "Question",
        name: "Is the $299 48h Latency Audit creditable toward the $1,200 Self-Hosted Deployment Kit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, 100%. Every dollar of the $299 48h Latency Audit can be credited toward the $1,200 Self-Hosted Deployment Kit or $3,000+ Enterprise SOW within 30 days, and the $299 Audit itself carries a >=40% latency reduction identified or 100% refund SLA.",
        },
      },
      {
        "@type": "Question",
        name: "Does self-hosted deployment work with Twilio, Telnyx, FreeSWITCH, and LiveKit SIP with zero audio egress?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. HardCall speaks standard 8kHz G.711 PCMU/PCMA RTP (ptime=20ms) compatible with Twilio Elastic SIP, Telnyx, SignalWire, FreeSWITCH/Asterisk, and LiveKit SIP, running 100% inside your private VPC with zero audio or SIP egress to HardCall.",
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HARDCALL_JSON_LD) }}
        />
        <script src="https://pulse.statementflow.win/api/pixel.js" defer />
      </head>
      <body className="antialiased bg-obsidian text-[#f5f5f7]">{children}</body>
    </html>
  );
}
