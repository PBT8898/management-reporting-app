import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Metric | Property Management Reporting", description: "Monthly property performance, material variances, and reviewed management commentary." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
