import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../../middlewares/auth"
import { prisma } from "../../../prisma/db"
import { getPatientDataSchema, statusGetSinglePatientAppointments } from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

export async function getAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            "/appointments/:id",
            {
                schema: {
                    tags: ["Appointments"],
                    summary: "Get a single patient appointments",
                    security: [
                        {
                            bearerAuth: [],
                        },
                    ],
                    params: getPatientDataSchema,
                    response: statusGetSinglePatientAppointments,
                },
            },
            async (request, response) => {
                try {
                    const { id } = request.params

                    const findAppointment = await prisma.appointment.findFirst({
                        where: {
                            id,
                        },
                        include: {
                            patient: true,
                            appointmentReason: true,
                            employee: true,
                        },
                    })

                    if (!findAppointment) throw new NotFound("Agendamento não encontrado")

                    const {
                        status,
                        employee: employeeData,
                        appointmentDate,
                        appointmentReason: reason,
                        patient: patientData,
                    } = findAppointment
                    const { cid, diagnosis } = reason
                    const { name, phone, email, id: patientId } = patientData
                    const { name: employeeName, id: employeeId } = employeeData

                    const appointment = {
                        status,
                        employee: {
                            employeeName,
                            employeeId,
                        },
                        appointmentDate,
                        appointmentReason: {
                            cid,
                            diagnosis,
                        },
                        patient: {
                            name,
                            phone,
                            email,
                            patientId,
                        },
                    }

                    return response.status(200).send({
                        appointment,
                    })
                } catch (error) {
                    return response.status(500).send({
                        message: JSON.stringify(error),
                    })
                }
            }
        )
}
