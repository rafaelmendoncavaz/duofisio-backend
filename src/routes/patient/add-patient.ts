import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { createPatientSchema, statusCreatePatientSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { auth } from "../../middlewares/auth"
import { BadRequest } from "../_errors/route-error"

export async function addPatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .post(
            "/dashboard/patients",
            {
                schema: {
                    tags: ["Patients"],
                    summary: "Create a new patient",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    body: createPatientSchema,
                    response: statusCreatePatientSchema,
                },
            },
            async (request, response) => {
                const {
                    name,
                    cpf,
                    dateOfBirth,
                    sex,
                    phone,
                    email,
                    profession,
                    address,
                    adultResponsible,
                    clinicalData,
                } = request.body

                const checkUser = await prisma.patients.findUnique({
                    where: {
                        cpf,
                        email,
                    },
                })

                if (checkUser) {
                    throw new BadRequest("Já existe um paciente cadastrado com este CPF/Email")
                }

                const patient = await prisma.patients.create({
                    data: {
                        name,
                        cpf,
                        dateOfBirth,
                        sex,
                        phone,
                        email,
                        profession,
                        address: {
                            create: {
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
                                  create: {
                                      name: adultResponsible.name,
                                      cpf: adultResponsible.cpf,
                                      phone: adultResponsible.phone,
                                      email: adultResponsible.email,
                                      address: {
                                          create: {
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
                        clinicalData: {
                            create: {
                                cid: clinicalData.cid,
                                covenant: clinicalData.covenant,
                                expires: clinicalData.expires,
                                CNS: clinicalData.CNS,
                                allegation: clinicalData.allegation,
                                diagnosis: clinicalData.diagnosis,
                            },
                        },
                    },
                    include: {
                        clinicalData: true,
                        address: true,
                        adultResponsible: {
                            include: {
                                address: true,
                            },
                        },
                    },
                })

                return response.status(201).send({
                    patientId: patient.id,
                })
            }
        )
}
