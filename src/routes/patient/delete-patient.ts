import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import { getPatientDataSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function deletePatient(app: FastifyInstance): Promise<void> {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .delete(
            "/patients/:id",
            {
                schema: {
                    tags: ["Patients"],
                    summary: "Delete patient data",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    params: getPatientDataSchema,
                },
            },
            async (request, response) => {
                const patientId = request.params.id

                const patientToBeDeleted = await prisma.patients.findFirst({
                    where: {
                        id: patientId,
                    },
                })

                if (!patientToBeDeleted) {
                    throw new NotFound("Patient not found")
                }

                await prisma.patients.delete({
                    where: {
                        id: patientId,
                    },
                })

                await prisma.address.delete({
                    where: {
                        id: patientToBeDeleted.addressId,
                    },
                })

                if (patientToBeDeleted.adultResponsibleId) {
                    const adult = await prisma.adultResponsible.findFirst({
                        where: {
                            id: patientToBeDeleted.adultResponsibleId,
                        },
                        include: {
                            patient: true,
                        },
                    })

                    if (adult && adult.patient.length === 0) {
                        await prisma.adultResponsible.delete({
                            where: {
                                id: adult.id,
                            },
                        })

                        await prisma.address.delete({
                            where: {
                                id: adult.addressId,
                            },
                        })
                    }
                }

                return response.status(204).send()
            }
        )
}
