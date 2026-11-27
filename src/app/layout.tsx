import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardcall.statementflow.win"),
  title: "HardCall — 52ms 8kHz Raw RTP Voice Barge-In Gateway & WebAudio Lab",
  description:
    "51.96ms (~52ms p95) PSTN/SIP full-duplex voice barge-in infrastructure: 20ms G.711 RTP + 12ms jitter buffer + 1.8ms libsoxr VHQ + 18ms Fast-Loop VAD + 0.16ms ring-buffer flush. Test live in browser or book a $299 48h SIP latency audit.",
  alternates: {
    canonical: "/",
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
        width: 2400,
        height: 1350,
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

const HARDCALL_APP_JSON_LD = {
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
};

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HARDCALL_APP_JSON_LD) }}
        />
        <script src="https://pulse.statementflow.win/api/pixel.js" defer />
      </head>
      <body className="antialiased bg-obsidian text-[#f5f5f7]">{children}</body>
    </html>
  );
}
