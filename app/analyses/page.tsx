import type { Metadata } from "next";
import Workspace from "../components/workspace";

export const metadata: Metadata = { title: "나의 분석 · MnM Insight" };
export default function Page() {
  return <Workspace view="analyses" />;
}
