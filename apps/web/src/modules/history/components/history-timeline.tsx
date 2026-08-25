import { describeEvent, getEventPresentation } from "@/modules/history/event-presentation";
import { formatEventDateTime } from "@/modules/history/format";
import type { ReservationEvent } from "@/modules/history/types";

/**
 * Linha do tempo dos eventos de uma reserva, do mais antigo para o mais
 * recente (critério de aceite ESTC-5). `events` já chega ordenado por
 * `lib/server/history`; este componente só renderiza.
 */
export function HistoryTimeline({ events }: { events: ReservationEvent[] }) {
  if (events.length === 0) {
    // Nunca deve acontecer — o contrato exige ao menos a criação — mas evita
    // uma tela quebrada caso o dado chegue inconsistente.
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum evento registrado para esta reserva.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const { label, icon: Icon, className } = getEventPresentation(
          event.type,
        );
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${className}`}
              >
                <Icon className="size-3.5" />
              </span>
              {isLast ? null : (
                <span className="w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>

            <div className={`flex flex-col gap-0.5 ${isLast ? "" : "pb-6"}`}>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatEventDateTime(event.occurredAt)}
              </span>
              <span className="text-sm font-medium">{label}</span>
              {event.type === "WAITLIST_PROMOTED" ? (
                <span className="text-sm text-muted-foreground">
                  {describeEvent(event)}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {event.actor ? `Por ${event.actor.name}` : "Evento automático"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
