import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import { getPatientDataSchema, updatePatientSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { BadRequest } from "../_errors/route-error"

// Tipos baseados nos schemas
type PatientParams = z.infer<typeof getPatientDataSchema>
type UpdatePatientBody = z.infer<typeof updatePatientSchema>

/**
 * Verifica se o paciente existe pelo ID.
 * @throws {BadRequest} Se o paciente não for encontrado.
 */
async function checkPatientExists(id: string): Promise<void> {
    const patient = await prisma.patients.findUnique({
        where: { id },
    })

    if (!patient) {
        throw new BadRequest("Este paciente não existe")
    }
}

/**
 * Verifica se o CPF ou email já estão em uso por outro paciente.
 * @throws {BadRequest} Se houver duplicata de CPF ou email.
 */
async function checkDuplicateCpfOrEmail(
    id: string,
    cpf: string,
    email: string | null
): Promise<void> {
    const duplicate = await prisma.patients.findFirst({
        where: {
            OR: [{ cpf }, { email }],
            id: { not: id },
        },
    })

    if (duplicate) {
        throw new BadRequest(
            "Um destes dados já está sendo usado por outro paciente: CPF, Email"
        )
    }
}

/**
 * Constrói os dados para atualização do paciente.
 */
function buildUpdateData(body: UpdatePatientBody) {
    return {
        name: body.name,
        cpf: body.cpf,
        dateOfBirth: body.dateOfBirth,
        sex: body.sex,
        phone: body.phone,
        email: body.email,
        profession: body.profession,
        address: {
            update: {
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
                  update: {
                      name: body.adultResponsible.name,
                      cpf: body.adultResponsible.cpf,
                      phone: body.adultResponsible.phone,
                      email: body.adultResponsible.email,
                      address: {
                          update: {
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
    }
}

/**
 * Registra a rota para atualizar os dados de um paciente.
 */
export async function updatePatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put(
        "/patients/:id",
        {
            schema: {
                tags: ["Patients"],
                summary: "Update patient data",
                security: [{ bearerAuth: [] }],
                body: updatePatientSchema,
                params: getPatientDataSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: PatientParams
                Body: UpdatePatientBody
            }>,
            reply
        ) => {
            const { id } = request.params
            const body = request.body

            await checkPatientExists(id)
            await checkDuplicateCpfOrEmail(id, body.cpf, body.email)

            await prisma.patients.update({
                where: { id },
                data: buildUpdateData(body),
                include: {
                    address: true,
                    adultResponsible: true,
                },
            })

            return reply.status(204).send()
        }
    )
}
