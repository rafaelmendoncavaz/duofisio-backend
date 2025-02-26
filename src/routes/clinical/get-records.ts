import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import {
    getPatientDataSchema,
    statusGetClinicalRecordListSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function getClinicalRecords(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients/:id/clinical",
        {
            schema: {
                tags: ["Clinical"],
                summary: "Get all of the patient clinical records",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                params: getPatientDataSchema,
                response: statusGetClinicalRecordListSchema,
            },
        },
        async (request, response) => {
            const { id } = request.params

            const patient = await prisma.patients.findFirst({
                where: {
                    id,
                },
            })

            if (!patient) throw new NotFound("Paciente não encontrado!")

            const clinicalRecordList = await prisma.clinicalData.findMany({
                where: {
                    patientId: id,
                },
                orderBy: {
                    cid: "asc",
                },
                select: {
                    id: true,
                    cid: true,
                    CNS: true,
                    covenant: true,
                    expires: true,
                    allegation: true,
                    diagnosis: true,
                },
            })

            if (!clinicalRecordList)
                throw new NotFound("Paciente sem registros clínicos!")

            return response.status(200).send({
                patientClinicalRecord: {
                    clinicalRecordList,
                    patientName: patient.name,
                    patientId: patient.id,
                },
            })
        }
    )
}
