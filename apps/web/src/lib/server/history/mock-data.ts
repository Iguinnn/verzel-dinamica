import type { ReservationHistory } from "@parking/contracts";

/**
 * Carga de demonstracao da tela de historico (ESTC-5).
 *
 * As datas sao literais ISO em UTC — nunca `new Date()` — para a tela ser
 * deterministica entre renders e entre servidor e cliente. Os eventos de cada
 * reserva estao fora de ordem de proposito: a ordenacao cronologica e
 * responsabilidade da camada de acesso, nao do dado.
 *
 * Os ids de setor sao os mesmos de `modules/sector-management/mock-data.ts`,
 * para as duas telas contarem a mesma historia.
 *
 * TODO(backend): remover quando `GET /v1/reservations` e
 * `GET /v1/reservations/:id/events` existirem.
 */

const sectorA = {
  id: "a4d1f2c0-1f2a-4c3b-9d5e-6f7a8b9c0d1e",
  name: "Setor A - VIP",
} as const;

const sectorB = {
  id: "b5e2a3d1-2a3b-4d4c-8e6f-7a8b9c0d1e2f",
  name: "Setor B - Coberto",
} as const;

const sectorC = {
  id: "c6f3b4e2-3b4c-4e5d-9f7a-8b9c0d1e2f3a",
  name: "Setor C - Descoberto",
} as const;

const ana = {
  id: "d7a4c5b6-4c5d-4f6e-8a1b-9c0d1e2f3a4b",
  name: "Ana Souza",
} as const;

const bruno = {
  id: "e8b5d6c7-5d6e-4a7f-9b2c-0d1e2f3a4b5c",
  name: "Bruno Lima",
} as const;

const carla = {
  id: "f9c6e7d8-6e7f-4b8a-8c3d-1e2f3a4b5c6d",
  name: "Carla Dias",
} as const;

const marina = {
  id: "0ad7f8e9-7f8a-4c9b-9d4e-2f3a4b5c6d7e",
  name: "Marina Alves",
} as const;

/** Reservas cujo cancelamento origina uma promocao mais adiante. */
const cancelledInSectorC = {
  id: "2cf9a0b1-9a0c-4e1d-9f6a-4b5c6d7e8f9a",
  plate: "DEF2G45",
} as const;

const cancelledInSectorB = {
  id: "5f2c3d4e-2d3f-4a4b-8c9d-7e8f9a0b1c2d",
  plate: "PQR6S23",
} as const;

export const mockReservationHistories: ReservationHistory[] = [
  {
    // Reserva recem-criada: o historico tem apenas o evento de criacao.
    reservation: {
      id: "1be8f9a0-8a9b-4d0c-8e5f-3a4b5c6d7e8f",
      plate: "ABC1D23",
      sectorId: sectorA.id,
      sectorName: sectorA.name,
      status: "ACTIVE",
      expectedArrivalAt: "2026-08-26T13:00:00.000Z",
      createdAt: "2026-08-25T11:42:00.000Z",
    },
    events: [
      {
        id: "a1b2c3d4-0b1c-4f2d-8a7b-5c6d7e8f9a0b",
        reservationId: "1be8f9a0-8a9b-4d0c-8e5f-3a4b5c6d7e8f",
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-25T11:42:00.000Z",
        actor: ana,
        triggeredByReservation: null,
        details: null,
      },
    ],
  },
  {
    // Reserva cancelada pelo proprio motorista. Liberou a vaga promovida abaixo.
    reservation: {
      id: cancelledInSectorC.id,
      plate: cancelledInSectorC.plate,
      sectorId: sectorC.id,
      sectorName: sectorC.name,
      status: "CANCELLED",
      expectedArrivalAt: "2026-08-24T15:30:00.000Z",
      createdAt: "2026-08-22T08:15:00.000Z",
    },
    events: [
      {
        id: "b2c3d4e5-1c2d-4a3e-9b8c-6d7e8f9a0b1c",
        reservationId: cancelledInSectorC.id,
        type: "RESERVATION_CANCELLED",
        occurredAt: "2026-08-24T09:05:00.000Z",
        actor: bruno,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "c3d4e5f6-2d3e-4b4f-8c9d-7e8f9a0b1c2d",
        reservationId: cancelledInSectorC.id,
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-22T08:15:00.000Z",
        actor: bruno,
        triggeredByReservation: null,
        details: null,
      },
    ],
  },
  {
    // Entrou na fila e saiu voluntariamente antes de ser promovida.
    reservation: {
      id: "3da0b1c2-0b1d-4f2e-8a7b-5c6d7e8f9a0b",
      plate: "GHI3J67",
      sectorId: sectorC.id,
      sectorName: sectorC.name,
      status: "LEFT_WAITLIST",
      expectedArrivalAt: "2026-08-25T18:00:00.000Z",
      createdAt: "2026-08-22T10:30:00.000Z",
    },
    events: [
      {
        id: "d4e5f6a7-3e4f-4c5a-9d0e-8f9a0b1c2d3e",
        reservationId: "3da0b1c2-0b1d-4f2e-8a7b-5c6d7e8f9a0b",
        type: "WAITLIST_JOINED",
        occurredAt: "2026-08-22T10:30:00.000Z",
        actor: carla,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "e5f6a7b8-4f5a-4d6b-8e1f-9a0b1c2d3e4f",
        reservationId: "3da0b1c2-0b1d-4f2e-8a7b-5c6d7e8f9a0b",
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-22T10:30:00.000Z",
        actor: carla,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "f6a7b8c9-5a6b-4e7c-9f2a-0b1c2d3e4f5a",
        reservationId: "3da0b1c2-0b1d-4f2e-8a7b-5c6d7e8f9a0b",
        type: "WAITLIST_LEFT",
        occurredAt: "2026-08-23T16:20:00.000Z",
        actor: carla,
        triggeredByReservation: null,
        details: null,
      },
    ],
  },
  {
    // Promovida da fila pelo cancelamento de DEF2G45.
    reservation: {
      id: "4eb1c2d3-1c2e-4a3f-9b8c-6d7e8f9a0b1c",
      plate: "JKL4M89",
      sectorId: sectorC.id,
      sectorName: sectorC.name,
      status: "ACTIVE",
      expectedArrivalAt: "2026-08-26T09:00:00.000Z",
      createdAt: "2026-08-23T07:50:00.000Z",
    },
    events: [
      {
        id: "a7b8c9d0-6b7c-4f8d-8a3b-1c2d3e4f5a6b",
        reservationId: "4eb1c2d3-1c2e-4a3f-9b8c-6d7e8f9a0b1c",
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-23T07:50:00.000Z",
        actor: ana,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "b8c9d0e1-7c8d-4a9e-9b4c-2d3e4f5a6b7c",
        reservationId: "4eb1c2d3-1c2e-4a3f-9b8c-6d7e8f9a0b1c",
        type: "WAITLIST_JOINED",
        occurredAt: "2026-08-23T07:50:00.000Z",
        actor: ana,
        triggeredByReservation: null,
        details: null,
      },
      {
        // Promocao automatica: nao tem autor humano.
        id: "c9d0e1f2-8d9e-4b0f-8c5d-3e4f5a6b7c8d",
        reservationId: "4eb1c2d3-1c2e-4a3f-9b8c-6d7e8f9a0b1c",
        type: "WAITLIST_PROMOTED",
        occurredAt: "2026-08-24T09:05:00.000Z",
        actor: null,
        triggeredByReservation: cancelledInSectorC,
        details: null,
      },
    ],
  },
  {
    // Ciclo completo: fila, promocao e cancelamento posterior.
    reservation: {
      id: "6a3d4e5f-3e4a-4b5c-9d0e-8f9a0b1c2d3e",
      plate: "MNO5P01",
      sectorId: sectorB.id,
      sectorName: sectorB.name,
      status: "CANCELLED",
      expectedArrivalAt: "2026-08-22T12:00:00.000Z",
      createdAt: "2026-08-18T06:20:00.000Z",
    },
    events: [
      {
        id: "d0e1f2a3-9e0f-4c1a-9d6e-4f5a6b7c8d9e",
        reservationId: "6a3d4e5f-3e4a-4b5c-9d0e-8f9a0b1c2d3e",
        type: "WAITLIST_JOINED",
        occurredAt: "2026-08-18T06:20:00.000Z",
        actor: bruno,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "e1f2a3b4-0f1a-4d2b-8e7f-5a6b7c8d9e0f",
        reservationId: "6a3d4e5f-3e4a-4b5c-9d0e-8f9a0b1c2d3e",
        type: "RESERVATION_CANCELLED",
        occurredAt: "2026-08-21T16:45:00.000Z",
        actor: bruno,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "f2a3b4c5-1a2b-4e3c-9f8a-6b7c8d9e0f1a",
        reservationId: "6a3d4e5f-3e4a-4b5c-9d0e-8f9a0b1c2d3e",
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-18T06:20:00.000Z",
        actor: bruno,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "a3b4c5d6-2b3c-4f4d-8a9b-7c8d9e0f1a2b",
        reservationId: "6a3d4e5f-3e4a-4b5c-9d0e-8f9a0b1c2d3e",
        type: "WAITLIST_PROMOTED",
        occurredAt: "2026-08-19T14:10:00.000Z",
        actor: null,
        triggeredByReservation: cancelledInSectorB,
        details: null,
      },
    ],
  },
  {
    // Cancelada por um administrador. Originou a promocao de MNO5P01.
    reservation: {
      id: cancelledInSectorB.id,
      plate: cancelledInSectorB.plate,
      sectorId: sectorB.id,
      sectorName: sectorB.name,
      status: "CANCELLED",
      expectedArrivalAt: "2026-08-20T11:00:00.000Z",
      createdAt: "2026-08-17T09:05:00.000Z",
    },
    events: [
      {
        id: "b4c5d6e7-3c4d-4a5e-9b0c-8d9e0f1a2b3c",
        reservationId: cancelledInSectorB.id,
        type: "RESERVATION_CREATED",
        occurredAt: "2026-08-17T09:05:00.000Z",
        actor: carla,
        triggeredByReservation: null,
        details: null,
      },
      {
        id: "c5d6e7f8-4d5e-4b6f-8c1d-9e0f1a2b3c4d",
        reservationId: cancelledInSectorB.id,
        type: "RESERVATION_CANCELLED",
        occurredAt: "2026-08-19T14:10:00.000Z",
        actor: marina,
        triggeredByReservation: null,
        details: null,
      },
    ],
  },
];
