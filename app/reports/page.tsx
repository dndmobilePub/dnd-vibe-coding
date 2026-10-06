import type { Metadata } from "next";
import Workspace from "../components/workspace";

export const metadata: Metadata = { title: "공유 리포트 · MnM Insight" };
export default function Page() {
  return <Workspace view="reports" />;
}
