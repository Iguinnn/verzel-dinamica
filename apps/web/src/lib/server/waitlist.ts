import { cookies } from "next/headers";

import {
  apiErrorSchema,
  joinWaitlistSchema,
  waitlistEntryResponseSchema,
  waitlistListResponseSchema,
  type ApiError,
  type JoinWaitlistInput,
  type WaitlistEntry,
  type WaitlistListResponse,
} from "@parking/contracts";

import { SESSION_COOKIE } from "@/lib/server/auth";

export class WaitlistApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiError,
  ) {
    super(payload.error.message);
  }
}

export function waitlistApiErrorResponse(error: unknown): Response {
  if (error instanceof WaitlistApiError) {
    return Response.json(error.payload, { status: error.status });
  }

  return Response.json(
    {
      error: {
        code: "WAITLIST_API_UNAVAILABLE",
        message: "Nao foi possivel acessar a API de lista de espera.",
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

async function apiError(response: Response): Promise<WaitlistApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = apiErrorSchema.safeParse(body);

  if (parsed.success) {
    return new WaitlistApiError(response.status, parsed.data);
  }

  return new WaitlistApiError(502, {
    error: {
      code: "INVALID_WAITLIST_API_RESPONSE",
      message: "A API de lista de espera retornou uma resposta invalida.",
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

/** Lista a fila de um setor, já ordenada e com as placas mascaradas pela API. */
export async function listSectorWaitlist(
  sectorId: string,
): Promise<WaitlistListResponse> {
  const response = await request(`/v1/sectors/${sectorId}/waitlist`);
  return waitlistListResponseSchema.parse(await response.json());
}

/** Entra na fila de um setor. */
export async function joinSectorWaitlist(
  sectorId: string,
  input: JoinWaitlistInput,
): Promise<WaitlistEntry> {
  const body = joinWaitlistSchema.parse(input);
  const response = await request(`/v1/sectors/${sectorId}/waitlist`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return waitlistEntryResponseSchema.parse(await response.json()).data;
}

/** Saída voluntária da fila. */
export async function leaveWaitlist(entryId: string): Promise<void> {
  await request(`/v1/waitlist/${entryId}`, { method: "DELETE" });
}
