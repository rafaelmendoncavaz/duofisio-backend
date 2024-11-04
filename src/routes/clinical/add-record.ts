import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import {
    createNewClinicalRecordSchema,
    getPatientDataSchema,
    statusClinicalRecordCreatedSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { BadRequest, NotFound } from "../_errors/route-error"

export async function addClinicalRecord(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .post(
            "/dashboard/patients/:id/clinical",
            {
                schema: {
                    tags: ["Clinical"],
                    summary: "Create a new patient clinical record",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    params: getPatientDataSchema,
                    body: createNewClinicalRecordSchema,
                    response: statusClinicalRecordCreatedSchema,
                },
            },
            async (request, response) => {
                const { id } = request.params
                const { cid, covenant, expires, allegation, diagnosis } =
                    request.body

                const patient = await prisma.patients.findUnique({
                    where: {
                        id,
                    },
                    include: {
                        clinicalData: true,
                    },
                })

                if (!patient) throw new NotFound("Paciente não encontrado!")

                const findCNS = await prisma.clinicalData.findFirst({
                    where: {
                        patientId: id,
                    },
                    select: {
                        CNS: true,
                    },
                })

                if (!findCNS)
                    throw new BadRequest("Paciente não possui CNS cadastrado!")

                await prisma.clinicalData.create({
                    data: {
                        cid,
                        CNS: findCNS.CNS,
                        covenant,
                        expires,
                        allegation,
                        diagnosis,
                        patientId: id,
                    },
                })

                return response.status(201).send({
                    message: "Registro criado com sucesso!",
                })
            }
        )
}
