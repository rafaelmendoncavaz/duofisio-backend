import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import {
    createNewClinicalRecordSchema,
    getPatientDataSchema,
    statusClinicalRecordCreatedSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { BadRequest, NotFound } from "../_errors/route-error"

// Tipos baseados nos schemas
type PatientParams = z.infer<typeof getPatientDataSchema>
type ClinicalRecordBody = z.infer<typeof createNewClinicalRecordSchema>

/**
 * Verifica se o paciente existe pelo ID.
 * @throws {NotFound} Se o paciente não for encontrado.
 */
async function checkPatientExists(id: string) {
    const patient = await prisma.patients.findUnique({
        where: { id },
        include: { clinicalData: true },
    })

    if (!patient) {
        throw new NotFound("Paciente não encontrado")
    }

    return patient
}

/**
 * Obtém o CNS existente do paciente.
 * @throws {BadRequest} Se o paciente não possuir CNS cadastrado.
 */
async function getPatientCNS(patientId: string): Promise<string | null> {
    const clinicalData = await prisma.clinicalData.findFirst({
        where: { patientId },
        select: { CNS: true },
    })

    if (!clinicalData) {
        throw new BadRequest("Paciente não possui CNS cadastrado")
    }

    return clinicalData.CNS
}

/**
 * Cria um novo registro clínico para o paciente.
 */
async function createClinicalRecord(
    patientId: string,
    cns: string | null,
    body: ClinicalRecordBody
) {
    await prisma.clinicalData.create({
        data: {
            cid: body.cid,
            CNS: cns,
            covenant: body.covenant,
            expires: body.expires,
            allegation: body.allegation,
            diagnosis: body.diagnosis,
            patientId,
        },
    })
}

/**
 * Registra a rota para criar um novo registro clínico de um paciente.
 */
export async function addClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/patients/:id/clinical",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Clinical"],
                summary: "Create a new patient clinical record",
                security: [{ cookieAuth: [] }],
                params: getPatientDataSchema,
                body: createNewClinicalRecordSchema,
                response: statusClinicalRecordCreatedSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: PatientParams
                Body: ClinicalRecordBody
            }>,
            reply
        ) => {
            const { id } = request.params
            const body = request.body

            await checkPatientExists(id)
            const cns = await getPatientCNS(id)
            await createClinicalRecord(id, cns, body)

            return reply
                .status(201)
                .send({ message: "Registro criado com sucesso!" })
        }
    )
}
