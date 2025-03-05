import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { prisma } from "../../../prisma/db"
import { NotFound } from "../_errors/route-error"
import { statusGetSinglePatientAppointments } from "../../schema/appointment"

/**
 * Busca os detalhes de um agendamento específico.
 * @throws {NotFound} Se o agendamento não for encontrado.
 */
async function getAppointmentById(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            id: true,
            appointmentDate: true,
            duration: true,
            status: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            employee: {
                select: {
                    id: true,
                    name: true,
                },
            },
            clinicalRecord: {
                select: {
                    cid: true,
                    allegation: true,
                    diagnosis: true,
                },
            },
        },
    })

    if (!appointment) {
        throw new NotFound("Agendamento não encontrado")
    }

    return {
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        status: appointment.status,
        patient: {
            patientId: appointment.patient.id,
            name: appointment.patient.name,
            phone: appointment.patient.phone,
            email: appointment.patient.email,
        },
        employee: {
            employeeId: appointment.employee.id,
            employeeName: appointment.employee.name,
        },
        appointmentReason: {
            cid: appointment.clinicalRecord.cid,
            allegation: appointment.clinicalRecord.allegation,
            diagnosis: appointment.clinicalRecord.diagnosis,
        },
    }
}

/**
 * Registra a rota para obter os detalhes de um agendamento específico.
 */
export async function getAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/appointments/:id",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Get details of a specific appointment",
                security: [{ bearerAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do agendamento deve ser um UUID"),
                }),
                response: statusGetSinglePatientAppointments,
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
            const { id } = request.params

            const appointment = await getAppointmentById(id)

            return reply.status(200).send({ appointment })
        }
    )
}
