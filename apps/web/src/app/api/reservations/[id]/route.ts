import { reservationResponseSchema } from "@parking/contracts";

import {
  getReservation,
  reservationApiErrorResponse,
} from "@/lib/server/reservations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const reservation = await getReservation(id);
    return Response.json(reservationResponseSchema.parse({ data: reservation }));
  } catch (error) {
    return reservationApiErrorResponse(error);
  }
}
