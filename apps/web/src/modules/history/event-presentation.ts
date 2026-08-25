import {
  CarIcon,
  CircleArrowUpIcon,
  CircleSlashIcon,
  ListMinusIcon,
  ListPlusIcon,
  type LucideIcon,
} from "lucide-react";

import type { ReservationEventType } from "@/modules/history/types";

/**
 * Apresentação de cada tipo de evento: rótulo, ícone e o tom semântico do
 * design system. A cor só aparece porque carrega significado — mesmo
 * princípio de `sector-management/components/sector-status-badge.tsx`.
 */
const eventPresentation: Record<
  ReservationEventType,
  { label: string; icon: LucideIcon; className: string }
> = {
  RESERVATION_CREATED: {
    label: "Reserva criada",
    icon: CarIcon,
    className: "bg-success/10 text-success",
  },
  RESERVATION_CANCELLED: {
    label: "Reserva cancelada",
    icon: CircleSlashIcon,
    className: "bg-destructive/10 text-destructive",
  },
  WAITLIST_JOINED: {
    label: "Entrou na lista de espera",
    icon: ListPlusIcon,
    className: "bg-warning/10 text-warning",
  },
  WAITLIST_LEFT: {
    label: "Saiu da lista de espera",
    icon: ListMinusIcon,
    className: "bg-muted text-muted-foreground",
  },
  WAITLIST_PROMOTED: {
    label: "Promovida da lista de espera",
    icon: CircleArrowUpIcon,
    className: "bg-success/10 text-success",
  },
};

export function getEventPresentation(type: ReservationEventType) {
  return eventPresentation[type];
}
