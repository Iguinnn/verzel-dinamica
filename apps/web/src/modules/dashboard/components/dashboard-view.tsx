import { HelloWorld } from "@/components/common/hello-world";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";

/** Landing screen of the authenticated area. */
export function DashboardView() {
  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="Overview of the parking lot occupancy."
      />
      <HelloWorld
        story="Main page"
        scope="Summary metrics and the operational overview land here."
      />
    </PageShell>
  );
}
