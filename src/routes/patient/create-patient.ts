import type { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { z } from "zod";
import {
    createPatientSchema,
    statusCreatePatientSchema,
} from "../../schema/schema";
import { prisma } from "../../../prisma/db";
import { BadRequest } from "../_errors/route-error";

// Tipo do corpo da requisição baseado no schema
type CreatePatientBody = z.infer<typeof createPatientSchema>;

/**
 * Verifica se já existe um paciente com o mesmo CPF ou email.
 * @throws {BadRequest} Se o CPF ou email já estiverem cadastrados.
 */
async function checkPatientExists(cpf: string): Promise<void> {
    const existingPatient = await prisma.patients.findUnique({
        where: {
            cpf,
        },
    });

    if (existingPatient) {
        throw new BadRequest("CPF já cadastrado");
    }
}

/**
 * Cria os dados aninhados para um novo paciente.
 */
function buildPatientData(body: CreatePatientBody) {
    return {
        name: body.name,
        cpf: body.cpf,
        dateOfBirth: body.dateOfBirth,
        sex: body.sex,
        phone: body.phone,
        email: body.email,
        profession: body.profession,
        address: {
            create: {
                cep: body.address.cep,
                street: body.address.street,
                number: body.address.number,
                complement: body.address.complement,
                neighborhood: body.address.neighborhood,
                city: body.address.city,
                state: body.address.state,
            },
        },
        adultResponsible: body.adultResponsible
            ? {
                  create: {
                      name: body.adultResponsible.name,
                      cpf: body.adultResponsible.cpf,
                      phone: body.adultResponsible.phone,
                      email: body.adultResponsible.email,
                      address: {
                          create: {
                              cep: body.adultResponsible.address.cep,
                              street: body.adultResponsible.address.street,
                              number: body.adultResponsible.address.number,
                              complement:
                                  body.adultResponsible.address.complement,
                              neighborhood:
                                  body.adultResponsible.address.neighborhood,
                              city: body.adultResponsible.address.city,
                              state: body.adultResponsible.address.state,
                          },
                      },
                  },
              }
            : undefined,
        clinicalData: {
            create: {
                cid: body.clinicalData.cid,
                covenant: body.clinicalData.covenant,
                expires: body.clinicalData.expires,
                CNS: body.clinicalData.CNS,
                allegation: body.clinicalData.allegation,
                diagnosis: body.clinicalData.diagnosis,
            },
        },
    };
}

/**
 * Registra a rota para adicionar um novo paciente.
 */
export async function addPatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/patients",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Patients"],
                summary: "Create a new patient",
                security: [{ cookieAuth: [] }],
                body: createPatientSchema,
                response: statusCreatePatientSchema,
            },
        },
        async (request: FastifyRequest<{ Body: CreatePatientBody }>, reply) => {
            const body = request.body;

            await checkPatientExists(body.cpf);

            const patient = await prisma.patients.create({
                data: buildPatientData(body),
                include: {
                    clinicalData: true,
                    address: true,
                    adultResponsible: {
                        include: {
                            address: true,
                        },
                    },
                },
            });

            return reply.status(201).send({ patientId: patient.id });
        }
    );
}
