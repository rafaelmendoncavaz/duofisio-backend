import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import { getPatientDataSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

// Tipo ajustado para incluir ambos os parâmetros
type ClinicalRecordParams = z.infer<typeof getPatientDataSchema> & {
    recordId: number
}

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

/**
 * Verifica se o registro clínico existe e pertence ao paciente.
 * @throws {NotFound} Se o registro não for encontrado.
 */
async function checkClinicalRecordExists(
    patientId: string,
    recordId: string
): Promise<void> {
    const clinicalRecord = await prisma.clinicalData.findUnique({
        where: {
            id: recordId,
            patientId,
        },
    })

    if (!clinicalRecord) {
        throw new NotFound("Registro clínico não encontrado")
    }
}

/**
 * Deleta o registro clínico especificado.
 */
async function deleteRecord(
    patientId: string,
    recordId: string
): Promise<void> {
    await prisma.clinicalData.delete({
        where: {
            patientId,
            id: recordId,
        },
    })
}

/**
 * Registra a rota para deletar um registro clínico de um paciente.
 */
export async function deleteClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/patients/:id/clinical/:recordId",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Clinical"],
                summary: "Delete a patient's clinical data",
                security: [{ cookieAuth: [] }],
                params: getPatientDataSchema, // Nota: deve ser ajustado para incluir recordId
            },
        },
        async (
            request: FastifyRequest<{ Params: ClinicalRecordParams }>,
            reply
        ) => {
            const { id, recordId } = request.params

            await checkPatientExists(id)
            await checkClinicalRecordExists(id, recordId)
            await deleteRecord(id, recordId)

            return reply.status(204).send()
        }
    )
}
