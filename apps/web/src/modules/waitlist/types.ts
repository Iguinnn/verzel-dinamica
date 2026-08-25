import type { Sector } from "@parking/contracts";

export type { Sector };

/** Enum `waitlist_status` do MER. */
export type WaitlistStatus = "WAITING" | "PROMOTED" | "LEFT";

/** Enum `reservation_status` do MER. */
export type ReservationStatus =
  | "WAITLISTED"
  | "ACTIVE"
  | "CANCELLED"
  | "LEFT_WAITLIST";

/**
 * Uma posição na fila de um setor.
 *
 * Corresponde à junção de `waitlist_entries` com a `reservations` que a
 * originou — a fila guarda a ordem, a reserva guarda placa, setor e chegada
 * prevista. Os nomes seguem as colunas do MER para que a integração seja um
 * mapeamento direto.
 *
 * TODO(backend): mover para `@parking/contracts` junto com o schema Zod
 * quando a API da ESTC-4 existir.
 */
export type WaitlistEntry = {
  /** `waitlist_entries.id` */
  id: string;
  /** `waitlist_entries.reservation_id` */
  reservationId: string;
  /** `waitlist_entries.sector_id` */
  sectorId: string;
  /** `reservations.user_id` — dono da entrada. */
  userId: string;
  /** `reservations.plate`, normalizada em maiúsculas e sem pontuação. */
  plate: string;
  /** `reservations.expected_arrival_at`, ISO 8601. */
  expectedArrivalAt: string;
  /** `waitlist_entries.joined_at`, ISO 8601. Define a ordem FIFO. */
  joinedAt: string;
  /** `waitlist_entries.status` */
  status: WaitlistStatus;
  /** `waitlist_entries.promoted_at`, ISO 8601. */
  promotedAt?: string;
  /** `waitlist_entries.left_at`, ISO 8601. */
  leftAt?: string;
};

/** Fila de um setor já ordenada, pronta para renderizar. */
export type SectorQueue = {
  sector: Sector;
  entries: WaitlistEntry[];
};

/** Valores crus do formulário de entrada na fila. */
export type WaitlistDraft = {
  sectorId: string;
  plate: string;
  /** Valor de um `<input type="datetime-local">`. */
  expectedArrivalAt: string;
};

export type WaitlistDraftErrors = Partial<Record<keyof WaitlistDraft, string>>;

export const emptyWaitlistDraft: WaitlistDraft = {
  sectorId: "",
  plate: "",
  expectedArrivalAt: "",
};
