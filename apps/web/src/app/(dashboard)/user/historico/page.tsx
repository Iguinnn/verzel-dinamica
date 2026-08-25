import type { Metadata } from "next";

import { HistoryView } from "@/modules/history/components/history-view";

export const metadata: Metadata = {
  title: "History",
};

export default function HistoryPage() {
  return <HistoryView />;
}
