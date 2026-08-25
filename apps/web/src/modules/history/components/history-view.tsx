import { HelloWorld } from "@/components/common/hello-world";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";

/** Chronological event log of a reservation. */
export function HistoryView() {
  return (
    <PageShell>
      <PageHeader
        title="History"
        description="Every event recorded for a reservation, oldest first."
      />
      <HelloWorld
        story="ESTC-5"
        scope="The reservation event timeline lands here."
      />
    </PageShell>
  );
}
