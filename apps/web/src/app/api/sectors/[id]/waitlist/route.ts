import {
  joinWaitlistSchema,
  sectorIdSchema,
  waitlistEntryResponseSchema,
  waitlistListResponseSchema,
} from "@parking/contracts";

import {
  joinSectorWaitlist,
  listSectorWaitlist,
  waitlistApiErrorResponse,
} from "@/lib/server/waitlist";

type WaitlistRouteContext = {
  params: Promise<{ id: string }>;
};

async function sectorId(context: WaitlistRouteContext) {
  const { id } = await context.params;
  return sectorIdSchema.safeParse(id);
}

function invalidIdResponse(message: string | undefined): Response {
  return Response.json(
    {
      error: {
        code: "INVALID_SECTOR_ID",
        message: message ?? "Identificador de setor invalido.",
      },
    },
    { status: 400 },
  );
}

export async function GET(_request: Request, context: WaitlistRouteContext) {
  const id = await sectorId(context);

  if (!id.success) {
    return invalidIdResponse(id.error.issues[0]?.message);
  }

  try {
    const entries = await listSectorWaitlist(id.data);
    return Response.json(waitlistListResponseSchema.parse(entries));
  } catch (error) {
    return waitlistApiErrorResponse(error);
  }
}

export async function POST(request: Request, context: WaitlistRouteContext) {
  const id = await sectorId(context);

  if (!id.success) {
    return invalidIdResponse(id.error.issues[0]?.message);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Corpo JSON invalido." } },
      { status: 400 },
    );
  }

  const input = joinWaitlistSchema.safeParse(body);

  if (!input.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_WAITLIST_REQUEST",
          message: input.error.issues[0]?.message ?? "Dados da fila invalidos.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const entry = await joinSectorWaitlist(id.data, input.data);
    return Response.json(waitlistEntryResponseSchema.parse({ data: entry }), {
      status: 201,
    });
  } catch (error) {
    return waitlistApiErrorResponse(error);
  }
}
