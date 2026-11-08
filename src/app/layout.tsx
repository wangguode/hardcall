import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HardCall — ChatGPT Is Polite. Real Interviewers Interrupt.",
  description:
    "AI high-pressure voice mock interviewer for FAANG screens, salary negotiations, consulting cases, and cold calls. 60ms real-time barge-in interruptions + $200K offer autopsy.",
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
