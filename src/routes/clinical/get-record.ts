import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import {
    getPatientDataSchema,
    statusGetSingleClinicalRecordSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function getSingleClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            "/dashboard/patients/:id/clinical/:recordId",
            {
                schema: {
                    tags: ["Clinical"],
                    summary: "Get patient's single record data",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    params: getPatientDataSchema,
                    response: statusGetSingleClinicalRecordSchema,
                },
            },
            async (request, response) => {
                const { id, recordId } = request.params

                const patient = await prisma.patients.findUnique({
                    where: {
                        id,
                    },
                })

                if (!patient) throw new NotFound("Paciente não encontrado!")

                const clinicalRecord = await prisma.clinicalData.findUnique({
                    where: {
                        id: recordId,
                        patientId: id,
                    },
                })

                if (!clinicalRecord)
                    throw new NotFound("Registro clínico não encontrado!")

                return response.status(200).send({
                    clinicalRecord,
                })
            }
        )
}
