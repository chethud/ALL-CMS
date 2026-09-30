import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Content studio",
  description: "Edit website content for every site from one login.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.className} min-h-screen bg-[#F3F6F8] text-[#102033] antialiased`}>
        {children}
      </body>
    </html>
  );
}
