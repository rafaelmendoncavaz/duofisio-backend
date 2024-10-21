import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { getPatientDataSchema, updatePatientSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { auth } from "../../middlewares/auth"
import { BadRequest } from "../_errors/route-error"

export async function updatePatient(app: FastifyInstance): Promise<void> {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .put(
            "/dashboard/patients/:id",
            {
                schema: {
                    tags: ["Patients"],
                    summary: "Update patient data",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    body: updatePatientSchema,
                    params: getPatientDataSchema,
                },
            },
            async (request, response) => {
                const patientId = request.params.id
                const { name, cpf, dateOfBirth, sex, phone, email, profession, address, adultResponsible } =
                    request.body

                const isPatientValid = await prisma.patients.findFirst({
                    where: {
                        id: patientId,
                    },
                })

                if (!isPatientValid) {
                    throw new BadRequest("Este paciente não existe")
                }

                const isCPForEmailValid = await prisma.patients.findFirst({
                    where: {
                        OR: [{ cpf: { equals: cpf } }, { email: { equals: email } }],
                        id: { not: patientId },
                    },
                })

                if (isCPForEmailValid) {
                    throw new BadRequest("Um destes dados já está sendo usado por outro paciente: CPF, Email")
                }

                await prisma.patients.update({
                    where: {
                        id: patientId,
                    },
                    data: {
                        name,
                        cpf,
                        dateOfBirth,
                        sex,
                        phone,
                        email,
                        profession,
                        address: {
                            update: {
                                cep: address.cep,
                                street: address.street,
                                number: address.number,
                                complement: address.complement,
                                neighborhood: address.neighborhood,
                                city: address.city,
                                state: address.state,
                            },
                        },
                        adultResponsible: adultResponsible
                            ? {
                                  update: {
                                      name: adultResponsible.name,
                                      cpf: adultResponsible.cpf,
                                      phone: adultResponsible.phone,
                                      email: adultResponsible.email,
                                      address: {
                                          update: {
                                              cep: adultResponsible.address.cep,
                                              street: adultResponsible.address.street,
                                              number: adultResponsible.address.number,
                                              complement: adultResponsible.address.complement,
                                              neighborhood: adultResponsible.address.neighborhood,
                                              city: adultResponsible.address.city,
                                              state: adultResponsible.address.state,
                                          },
                                      },
                                  },
                              }
                            : undefined,
                    },
                    include: {
                        address: true,
                        adultResponsible: true,
                    },
                })

                return response.status(204).send()
            }
        )
}
