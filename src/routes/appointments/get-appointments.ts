import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import { prisma } from "../../../prisma/db"
import { statusGetAppointmentsSchema } from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

export async function getAppointments(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            "/dashboard/appointments",
            {
                schema: {
                    tags: ["Appointments"],
                    summary: "Get a list of all appointments",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    response: statusGetAppointmentsSchema,
                },
            },
            async (request, response) => {
                try {
                    const appointments = await prisma.appointment.findMany({
                        select: {
                            id: true,
                            appointmentDate: true,
                            status: true,
                            patient: {
                                select: {
                                    name: true,
                                    id: true,
                                    cpf: true,
                                },
                            },
                            appointmentReason: {
                                select: {
                                    cid: true,
                                },
                            },
                            employee: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    })

                    if (!appointments) {
                        throw new NotFound("Nenhum agendamento encontrado")
                    }

                    return response.status(200).send({
                        appointments,
                    })
                } catch (error) {
                    return response.status(500).send({
                        message: JSON.stringify(error),
                    })
                }
            }
        )
}
