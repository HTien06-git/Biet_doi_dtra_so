import type { Metadata } from "next";
import { Nunito, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const fontDisplay = Nunito({
  variable: "--font-display",
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const fontSans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đội Điều Tra Số – Vượt Trạm Phá Án | Digital Detective 2D Game",
  description: "Web Game tương tác phá án công nghệ cao, nhận diện lừa đảo số và rèn luyện kỹ năng an toàn thông tin theo phong cách Case Hunter 2D Cartoon rực rỡ.",
  keywords: ["đội điều tra số", "an toàn thông tin", "phá án", "case hunter", "web game giáo dục"],
};

import { AudioProvider } from "./providers/AudioProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FDF6E3] text-[#1E293B]">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
