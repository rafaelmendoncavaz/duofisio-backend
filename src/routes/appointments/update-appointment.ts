import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import {
    getPatientDataSchema,
    statusUpdateAppointmentSchema,
    updateAppointmentSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function updateAppointment(app: FastifyInstance): Promise<void> {
    app.withTypeProvider<ZodTypeProvider>().patch(
        "/appointments/:id",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Update an appointment",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                body: updateAppointmentSchema,
                params: getPatientDataSchema,
                response: statusUpdateAppointmentSchema,
            },
        },
        async (request, response) => {
            try {
                const { id: appointmentId } = request.params
                const { status, employee, appointmentDate } = request.body

                const findAppointment = await prisma.appointment.findUnique({
                    where: {
                        id: appointmentId,
                    },
                })

                if (!findAppointment)
                    throw new NotFound("Agendamento não encontrado")

                const [findPatient, findReason] = await Promise.all([
                    prisma.patients.findUnique({
                        where: {
                            id: findAppointment.patientId,
                        },
                    }),

                    prisma.clinicalData.findUnique({
                        where: {
                            patientId: findAppointment.patientId,
                            id: findAppointment.appointmentReasonId,
                        },
                    }),
                ])

                if (!findPatient) throw new NotFound("Paciente não encontrado")
                if (!findReason)
                    throw new NotFound("Motivo de consulta não encontrado")

                await prisma.appointment.update({
                    where: {
                        id: findAppointment.id,
                        patientId: findPatient.id,
                        appointmentReasonId: findReason.id,
                    },
                    data: {
                        status,
                        appointmentDate,
                        employee: {
                            connect: {
                                name: employee.employeeName,
                                id: employee.employeeId,
                            },
                        },
                    },
                })

                return response.status(204).send()
            } catch (error) {
                return response.status(500).send({
                    message: JSON.stringify(error),
                })
            }
        }
    )
}
