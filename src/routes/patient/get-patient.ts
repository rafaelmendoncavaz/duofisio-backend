import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import { prisma } from "../../../prisma/db"
import { getPatientDataSchema, statusPatientDataSchema } from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

export async function getPatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            "/dashboard/patients/:id",
            {
                schema: {
                    tags: ["Patients"],
                    summary: "Get details of a specific patient",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    params: getPatientDataSchema,
                    response: statusPatientDataSchema,
                },
            },
            async (request, response) => {
                const { id } = request.params

                const patient = await prisma.patients.findUnique({
                    where: {
                        id,
                    },
                    select: {
                        id: true,
                        name: true,
                        cpf: true,
                        dateOfBirth: true,
                        phone: true,
                        email: true,
                        sex: true,
                        profession: true,
                        createdAt: true,
                        updatedAt: true,
                        address: {
                            select: {
                                cep: true,
                                street: true,
                                number: true,
                                complement: true,
                                neighborhood: true,
                                city: true,
                                state: true,
                            },
                        },
                        adultResponsible: {
                            select: {
                                name: true,
                                cpf: true,
                                phone: true,
                                email: true,
                                address: {
                                    select: {
                                        cep: true,
                                        street: true,
                                        number: true,
                                        complement: true,
                                        neighborhood: true,
                                        city: true,
                                        state: true,
                                    },
                                },
                            },
                        },
                        clinicalData: {
                            select: {
                                id: true,
                                cid: true,
                                covenant: true,
                                expires: true,
                                CNS: true,
                                allegation: true,
                                diagnosis: true,
                            },
                        },
                        appointments: {
                            select: {
                                id: true,
                                appointmentDate: true,
                                status: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                })

                if (!patient) {
                    throw new NotFound("Patient not found")
                }

                return response.status(200).send({
                    patient,
                })
            }
        )
}
