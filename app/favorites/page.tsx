import type { Metadata } from "next";
import Workspace from "../components/workspace";

export const metadata: Metadata = { title: "즐겨찾기 · MnM Insight" };
export default function Page() {
  return <Workspace view="favorites" />;
}
