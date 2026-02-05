import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Swarm Office",
  description: "Multi-Agent System for Complex Task Execution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
