import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { prisma } from "../../../prisma/db"
import { statusGetPatientsSchema } from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

/**
 * Busca a lista de todos os pacientes ordenados por nome.
 * @throws {NotFound} Se nenhum paciente for encontrado.
 */
async function fetchAllPatients() {
    const patients = await prisma.patients.findMany({
        select: {
            id: true,
            name: true,
            phone: true,
            cpf: true,
            sex: true,
            appointments: {
                select: {
                    id: true,
                    totalSessions: true,
                    sessions: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            status: true,
                        },
                    },
                    employee: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    })

    if (patients.length === 0) {
        throw new NotFound("Nenhum paciente encontrado")
    }

    return patients
}

/**
 * Registra a rota para obter a lista de todos os pacientes.
 */
export async function getPatients(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients",
        {
            schema: {
                tags: ["Patients"],
                summary: "Get a list of all patients",
                security: [{ bearerAuth: [] }],
                response: statusGetPatientsSchema,
            },
        },
        async (request: FastifyRequest, reply) => {
            const patients = await fetchAllPatients()
            return reply.status(200).send({ patients })
        }
    )
}
