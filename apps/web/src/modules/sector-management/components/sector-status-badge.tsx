import {
  CircleCheckIcon,
  CircleSlashIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getOccupancyRate,
  getSectorStatus,
} from "@/modules/sector-management/sector-status";
import type { Sector, SectorStatus } from "@/modules/sector-management/types";

/**
 * Mapa de status para os tokens semânticos do design system. São as únicas
 * cores da tela: a paleta é monocromática e a cor só aparece onde carrega
 * significado.
 */
const statusPresentation: Record<
  SectorStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  livre: {
    label: "Livre",
    icon: CircleCheckIcon,
    className: "bg-success/10 text-success",
  },
  atencao: {
    label: "Atenção",
    icon: TriangleAlertIcon,
    className: "bg-warning/10 text-warning",
  },
  lotado: {
    label: "Lotado",
    icon: CircleSlashIcon,
    className: "bg-destructive/10 text-destructive",
  },
};

/** Selo de lotação do setor. Em atenção, exibe o percentual ocupado. */
export function SectorStatusBadge({ sector }: { sector: Sector }) {
  const status = getSectorStatus(sector);
  const { label, icon: Icon, className } = statusPresentation[status];

  return (
    <Badge variant="secondary" className={className}>
      <Icon data-icon="inline-start" />
      {status === "atencao" ? `${label} (${getOccupancyRate(sector)}%)` : label}
    </Badge>
  );
}
