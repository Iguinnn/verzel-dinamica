import {
  createReservationSchema,
  reservationResponseSchema,
} from "@parking/contracts";

import {
  createReservation,
  listReservations,
  reservationApiErrorResponse,
} from "@/lib/server/reservations";

export async function GET() {
  try {
    return Response.json(await listReservations());
  } catch (error) {
    return reservationApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Corpo JSON invalido." } },
      { status: 400 },
    );
  }

  const input = createReservationSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_RESERVATION",
          message:
            input.error.issues[0]?.message ?? "Dados da reserva invalidos.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const reservation = await createReservation(input.data);
    return Response.json(reservationResponseSchema.parse({ data: reservation }), {
      status: 201,
    });
  } catch (error) {
    return reservationApiErrorResponse(error);
  }
}
