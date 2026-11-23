import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hardcall.statementflow.win"),
  title: "HardCall — 60ms 8kHz RTP Voice Barge-In Gateway & Open-Source Simulator",
  description:
    "Sub-60ms PSTN/SIP telephony barge-in architecture (FreeSWITCH + 8kHz raw RTP + SOXR VHQ + 0.16ms ring-buffer flush). Test full-duplex voice interruption free in your browser or book a $299 48h latency audit.",
  openGraph: {
    title: "HardCall — 60ms 8kHz RTP Voice Gateway & Free Barge-In Simulator",
    description:
      "Eliminate 900ms+ WebSocket voice agent barge-in lag. Open-source browser simulator + enterprise 8kHz RTP / FreeSWITCH deployment kit.",
    url: "https://hardcall.statementflow.win",
    siteName: "HardCall",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "HardCall — 60ms 8kHz RTP Voice Gateway & Barge-In Simulator",
    description:
      "Sub-60ms PSTN/SIP barge-in architecture vs 900ms+ WebSocket lag. Free simulator + $299 48h latency audit.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-obsidian text-[#f5f5f7]">{children}</body>
    </html>
  );
}
