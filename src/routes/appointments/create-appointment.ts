import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import {
    createAppointmentSchema,
    statusCreateAppointmentSchema,
} from "../../schema/schema"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"

export async function createAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/appointments",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Create a new appointment",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                body: createAppointmentSchema,
                response: statusCreateAppointmentSchema,
            },
        },
        async (request, response) => {
            try {
                const { appointmentDate, status, patient, employee, reason } =
                    request.body

                const [findPatient, findEmployee, findReason] =
                    await Promise.all([
                        prisma.patients.findUnique({
                            where: {
                                cpf: patient.cpf,
                            },
                        }),
                        prisma.employees.findUnique({
                            where: {
                                id: employee.id,
                            },
                        }),
                        prisma.clinicalData.findFirst({
                            where: {
                                patientId: patient.id,
                                cid: reason.cid,
                            },
                        }),
                    ])

                if (!findPatient) throw new NotFound("Paciente não encontrado!")
                if (!findEmployee)
                    throw new NotFound("Fisioterapeuta não encontrado!")
                if (!findReason)
                    throw new NotFound("Motivo de consulta não encontrado!")

                const appointment = await prisma.appointment.create({
                    data: {
                        appointmentDate,
                        status,
                        patientId: patient.id,
                        employeeId: employee.id,
                        appointmentReasonId: findReason.id,
                    },
                })

                return response.status(201).send({
                    appointmentId: appointment.id,
                })
            } catch (error) {
                return response.status(500).send({
                    message: JSON.stringify(error),
                })
            }
        }
    )
}
