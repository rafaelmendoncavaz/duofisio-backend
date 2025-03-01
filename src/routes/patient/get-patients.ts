import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { prisma } from "../../../prisma/db"
import { statusGetPatientsSchema } from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

export async function getPatients(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients",
        {
            schema: {
                tags: ["Patients"],
                summary: "Get a list of all patients",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                response: statusGetPatientsSchema,
            },
        },
        async (request, response) => {
            const patients = await prisma.patients.findMany({
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    cpf: true,
                    sex: true,
                    appointments: {
                        select: {
                            appointmentDate: true,
                            status: true,
                            employee: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    name: "asc",
                },
            })

            console.log(patients)

            if (!patients) {
                throw new NotFound("Nenhum paciente encontrado")
            }

            return response.status(200).send({
                patients,
            })
        }
    )
}
