import type { Metadata } from "next";
import "./globals.css";
import { GlobalDialogImageViewer } from "@/components/GlobalDialogImageViewer";
import { GlobalEntityQuickViewLayer } from "@/components/GlobalEntityQuickViewLayer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "LikeSized — Find your Fit Twin. Find your fit.",
  description: "Match with people who have a body like yours and learn what brands, sizes, and clothes work for them.",
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
        <GlobalEntityQuickViewLayer />
        <GlobalDialogImageViewer />
      </body>
    </html>
  );
}
