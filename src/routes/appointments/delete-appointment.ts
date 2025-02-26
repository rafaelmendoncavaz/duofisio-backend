import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { getPatientDataSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function deleteAppointment(app: FastifyInstance): Promise<void> {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/appointments/:id",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Delete patient appointment",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                params: getPatientDataSchema,
            },
        },
        async (request, response) => {
            try {
                const { id: appointmentId } = request.params

                const appointment = await prisma.appointment.findFirst({
                    where: {
                        id: appointmentId,
                    },
                })

                if (!appointment)
                    throw new NotFound("Agendamento não encontrado!")

                await prisma.appointment.delete({
                    where: {
                        id: appointmentId,
                    },
                })

                return response.status(204).send()
            } catch (error) {
                return response.status(500).send({
                    message: JSON.stringify(error),
                })
            }
        }
    )
}
