import { cancelReservationResponseSchema } from "@parking/contracts";

import {
  cancelReservation,
  reservationApiErrorResponse,
} from "@/lib/server/reservations";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await cancelReservation(id);
    return Response.json(cancelReservationResponseSchema.parse({ data }));
  } catch (error) {
    return reservationApiErrorResponse(error);
  }
}
