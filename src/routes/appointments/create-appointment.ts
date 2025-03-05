import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import { isBefore, isSameDay, addMinutes } from "date-fns"
import { prisma } from "../../../prisma/db"
import { BadRequest } from "../_errors/route-error"
import {
    createAppointmentSchema,
    statusCreateAppointmentSchema,
} from "../../schema/appointment" // Ajustado

// Ajuste no schema para UUID e novos campos
const enhancedCreateAppointmentSchema = createAppointmentSchema

/**
 * Verifica se há conflito de horário para o funcionário no mesmo dia e intervalo.
 * @throws {BadRequest} Se o funcionário já tiver um agendamento no intervalo.
 */
async function checkEmployeeAvailability(
    employeeId: string,
    appointmentDate: Date,
    duration: number
) {
    const startDate = appointmentDate
    const endDate = addMinutes(startDate, duration)

    const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
            employeeId,
            appointmentDate: {
                gte: startDate,
                lt: endDate,
            },
            AND: {
                appointmentDate: {
                    gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)), // Início do dia
                    lt: new Date(new Date(startDate).setHours(23, 59, 59, 999)), // Fim do dia
                },
            },
        },
    })

    if (conflictingAppointment) {
        throw new BadRequest(
            "O funcionário já possui um agendamento neste dia e horário"
        )
    }
}

/**
 * Cria um novo agendamento para um paciente com um funcionário.
 */
async function createAppointmentLogic(
    patientId: string,
    employeeId: string,
    clinicalRecordId: string,
    appointmentDate: Date,
    duration: number
) {
    // Validação de data futura ou atual
    const now = new Date()
    if (isBefore(appointmentDate, now) && !isSameDay(appointmentDate, now)) {
        throw new BadRequest("A data do agendamento deve ser hoje ou no futuro")
    }

    // Verifica disponibilidade do funcionário
    await checkEmployeeAvailability(employeeId, appointmentDate, duration)

    // Cria o agendamento
    const appointment = await prisma.appointment.create({
        data: {
            patientId,
            employeeId,
            clinicalRecordId,
            appointmentDate,
            duration,
            status: "SOLICITADO",
        },
    })

    return appointment.id
}

/**
 * Registra a rota para criar um novo agendamento.
 */
export async function createAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/appointments",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Create a new appointment for a patient",
                security: [{ bearerAuth: [] }],
                body: enhancedCreateAppointmentSchema,
                response: statusCreateAppointmentSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof enhancedCreateAppointmentSchema>
            }>,
            reply
        ) => {
            const {
                patient,
                employee,
                appointmentDate,
                duration,
                clinicalRecordId,
            } = request.body

            const appointmentId = await createAppointmentLogic(
                patient.id,
                employee.id,
                clinicalRecordId,
                appointmentDate,
                duration
            )

            return reply.status(201).send({ appointmentId })
        }
    )
}
