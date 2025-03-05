import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import {
    getPatientDataSchema,
    statusGetSingleClinicalRecordSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

/**
 * Verifica se o paciente existe pelo ID.
 * @throws {NotFound} Se o paciente não for encontrado.
 */
export async function checkPatientExists(id: string): Promise<void> {
    const patient = await prisma.patients.findUnique({
        where: { id },
    })

    if (!patient) {
        throw new NotFound("Paciente não encontrado")
    }
}

// Tipo ajustado para incluir ambos os parâmetros
type ClinicalRecordParams = z.infer<typeof getPatientDataSchema> & {
    recordId: number
}

/**
 * Busca um registro clínico específico de um paciente.
 * @throws {NotFound} Se o registro não for encontrado.
 */
async function getClinicalRecord(patientId: string, recordId: string) {
    const clinicalRecord = await prisma.clinicalData.findUnique({
        where: {
            id: recordId,
            patientId,
        },
    })

    if (!clinicalRecord) {
        throw new NotFound("Registro clínico não encontrado")
    }

    return clinicalRecord
}

/**
 * Registra a rota para obter um registro clínico específico de um paciente.
 */
export async function getSingleClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients/:id/clinical/:recordId",
        {
            schema: {
                tags: ["Clinical"],
                summary: "Get patient's single record data",
                security: [{ bearerAuth: [] }],
                params: getPatientDataSchema, // Nota: deve ser ajustado para incluir recordId
                response: statusGetSingleClinicalRecordSchema,
            },
        },
        async (
            request: FastifyRequest<{ Params: ClinicalRecordParams }>,
            reply
        ) => {
            const { id, recordId } = request.params

            await checkPatientExists(id)
            const clinicalRecord = await getClinicalRecord(id, recordId)

            return reply.status(200).send({ clinicalRecord })
        }
    )
}
