import { HelloWorld } from "@/components/common/hello-world";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";

/** Listing screen for the parking sectors. */
export function SectorsView() {
  return (
    <PageShell>
      <PageHeader
        title="Sectors"
        description="Registration, availability and hourly rate per sector."
      />
      <HelloWorld
        story="ESTC-1"
        scope="The sector list and the creation form land here."
      />
    </PageShell>
  );
}
