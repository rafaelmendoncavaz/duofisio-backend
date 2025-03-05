import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import {
    getPatientDataSchema,
    statusGetClinicalRecordListSchema,
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

// Tipo dos parâmetros
type PatientParams = z.infer<typeof getPatientDataSchema>

// Campos selecionados para registros clínicos
const CLINICAL_RECORD_SELECT = {
    id: true,
    cid: true,
    CNS: true,
    covenant: true,
    expires: true,
    allegation: true,
    diagnosis: true,
}

/**
 * Busca todos os registros clínicos de um paciente.
 */
async function getPatientClinicalRecords(patientId: string) {
    const clinicalRecordList = await prisma.clinicalData.findMany({
        where: { patientId },
        orderBy: { cid: "asc" },
        select: CLINICAL_RECORD_SELECT,
    })

    return clinicalRecordList
}

/**
 * Busca o paciente e retorna nome e ID para a resposta.
 * @throws {NotFound} Se o paciente não for encontrado.
 */
async function getPatientDetails(id: string) {
    const patient = await prisma.patients.findUnique({
        where: { id },
        select: { id: true, name: true },
    })

    if (!patient) {
        throw new NotFound("Paciente não encontrado")
    }

    return patient
}

/**
 * Registra a rota para obter todos os registros clínicos de um paciente.
 */
export async function getClinicalRecords(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients/:id/clinical",
        {
            schema: {
                tags: ["Clinical"],
                summary: "Get all of the patient clinical records",
                security: [{ bearerAuth: [] }],
                params: getPatientDataSchema,
                response: statusGetClinicalRecordListSchema,
            },
        },
        async (request: FastifyRequest<{ Params: PatientParams }>, reply) => {
            const { id } = request.params

            const patient = await getPatientDetails(id) // Usa findUnique e seleciona apenas o necessário
            const clinicalRecordList = await getPatientClinicalRecords(id)

            return reply.status(200).send({
                patientClinicalRecord: {
                    clinicalRecordList,
                    patientName: patient.name,
                    patientId: patient.id,
                },
            })
        }
    )
}
