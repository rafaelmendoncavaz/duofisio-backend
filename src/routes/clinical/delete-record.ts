import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { FastifyInstance } from "fastify/types/instance"
import { getPatientDataSchema } from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function deleteClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/patients/:id/clinical/:recordId",
        {
            schema: {
                tags: ["Clinical"],
                summary: "Delete a patient's clinical data",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                params: getPatientDataSchema,
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

            await prisma.clinicalData.delete({
                where: {
                    patientId: id,
                    id: recordId,
                },
            })

            return response.status(204).send()
        }
    )
}
