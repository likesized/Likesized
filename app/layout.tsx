import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "LikeSized — See what fits people built like you",
  description: "Real clothing fit data from people with measurements like yours.",
  icons: {
    icon: "/brand/likesized-icon.png",
    shortcut: "/brand/likesized-icon.png",
    apple: "/brand/likesized-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
