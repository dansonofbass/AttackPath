import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});
export const metadata: Metadata = {
  title: "AttackPath AI | Security Exposure Intelligence",
  description: "A local, frontend-only security exposure analytics prototype.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={orbitron.variable}>{children}</body>
    </html>
  );
}
