import { cookies } from "next/headers";

import {
  apiErrorSchema,
  cancelReservationResponseSchema,
  createReservationSchema,
  reservationEventListResponseSchema,
  reservationListResponseSchema,
  reservationResponseSchema,
  type ApiError,
  type CancelReservationResponse,
  type CreateReservationInput,
  type Reservation,
  type ReservationEventListResponse,
  type ReservationListResponse,
} from "@parking/contracts";

import { SESSION_COOKIE } from "@/lib/server/auth";

export class ReservationApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiError,
  ) {
    super(payload.error.message);
  }
}

export function reservationApiErrorResponse(error: unknown): Response {
  if (error instanceof ReservationApiError) {
    return Response.json(error.payload, { status: error.status });
  }

  return Response.json(
    {
      error: {
        code: "RESERVATION_API_UNAVAILABLE",
        message: "Nao foi possivel acessar a API de reservas.",
      },
    },
    { status: 502 },
  );
}

function apiUrl() {
  return process.env.API_URL ?? "http://localhost:3333";
}

async function cookieHeader() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? `${SESSION_COOKIE}=${token}` : "";
}

async function apiError(response: Response): Promise<ReservationApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(body);

  if (parsed.success) {
    return new ReservationApiError(response.status, parsed.data);
  }

  return new ReservationApiError(502, {
    error: {
      code: "INVALID_RESERVATION_API_RESPONSE",
      message: "A API de reservas retornou uma resposta invalida.",
    },
  });
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${apiUrl()}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      cookie: await cookieHeader(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await apiError(response);
  }

  return response;
}

export async function listReservations(): Promise<ReservationListResponse> {
  const response = await request("/v1/reservations");
  return reservationListResponseSchema.parse(await response.json());
}

export async function getReservation(id: string): Promise<Reservation> {
  const response = await request(`/v1/reservations/${id}`);
  return reservationResponseSchema.parse(await response.json()).data;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  const body = createReservationSchema.parse(input);
  const response = await request("/v1/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return reservationResponseSchema.parse(await response.json()).data;
}

export async function cancelReservation(
  id: string,
): Promise<CancelReservationResponse["data"]> {
  const response = await request(`/v1/reservations/${id}/cancel`, {
    method: "POST",
  });
  return cancelReservationResponseSchema.parse(await response.json()).data;
}

export async function listReservationEvents(
  id: string,
): Promise<ReservationEventListResponse> {
  const response = await request(`/v1/reservations/${id}/events`);
  return reservationEventListResponseSchema.parse(await response.json());
}
