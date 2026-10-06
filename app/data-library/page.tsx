import type { Metadata } from "next";
import Workspace from "../components/workspace";

export const metadata: Metadata = { title: "데이터 라이브러리 · MnM Insight" };
export default function Page() {
  return <Workspace view="data" />;
}
