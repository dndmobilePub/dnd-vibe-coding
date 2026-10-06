import type { Metadata } from "next";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/600.css";
import "@fontsource/noto-sans-kr/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MnM Insight · AI 데이터 분석",
  description:
    "데이터에서 인사이트까지, 더 쉬운 분석. LS MnM AI 데이터 분석 워크스페이스 프로토타입.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
