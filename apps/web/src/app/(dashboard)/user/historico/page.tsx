import type { Metadata } from "next";

import { HistoryView } from "@/modules/history/components/history-view";

export const metadata: Metadata = {
  title: "Histórico",
};

export default function HistoryPage() {
  return <HistoryView />;
}
