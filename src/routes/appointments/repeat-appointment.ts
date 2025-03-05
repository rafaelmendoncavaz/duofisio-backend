import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { addDays, isSameDay, addMinutes, isBefore, getDay } from "date-fns"
import { prisma } from "../../../prisma/db"
import { BadRequest, NotFound } from "../_errors/route-error"
import {
    repeatAppointmentSchema,
    statusRepeatAppointmentSchema,
} from "../../schema/appointment"

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
            `O funcionário já possui um agendamento em ${startDate.toISOString()}`
        )
    }
}

/**
 * Gera datas futuras para as sessões baseadas nos dias da semana e quantidade.
 */
function generateSessionDates(
    startDate: Date,
    sessionCount: number,
    daysOfWeek: number[]
): Date[] {
    const sessionDates: Date[] = []
    let currentDate = startDate
    let sessionsGenerated = 0

    while (sessionsGenerated < sessionCount) {
        const dayOfWeek = getDay(currentDate) // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        if (daysOfWeek.includes(dayOfWeek)) {
            // Só adiciona se for dia atual ou futuro
            if (
                !isBefore(currentDate, new Date()) ||
                isSameDay(currentDate, new Date())
            ) {
                sessionDates.push(new Date(currentDate))
                sessionsGenerated++
            }
        }
        currentDate = addDays(currentDate, 1) // Avança um dia
    }

    return sessionDates
}

/**
 * Cria novos agendamentos baseados em um agendamento original.
 */
async function repeatAppointmentLogic(
    appointmentId: string,
    sessionCount: number,
    daysOfWeek: number[]
) {
    // Busca o agendamento original
    const originalAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, employee: true, clinicalRecord: true },
    })

    if (!originalAppointment) {
        throw new NotFound("Agendamento não encontrado")
    }

    if (originalAppointment.status !== "FINALIZADO") {
        throw new BadRequest(
            "A repetição só é permitida para agendamentos finalizados"
        )
    }

    const {
        patientId,
        employeeId,
        clinicalRecordId,
        appointmentDate,
        duration,
    } = originalAppointment

    // Gera as datas das sessões futuras
    const sessionDates = generateSessionDates(
        appointmentDate,
        sessionCount,
        daysOfWeek
    )

    // Cria os novos agendamentos
    const appointmentIds: string[] = []
    for (const date of sessionDates) {
        await checkEmployeeAvailability(employeeId, date, duration) // Valida cada sessão

        const newAppointment = await prisma.appointment.create({
            data: {
                patientId,
                employeeId,
                clinicalRecordId,
                appointmentDate: date,
                duration,
                status: "SOLICITADO", // Novo agendamento começa como SOLICITADO
            },
        })

        appointmentIds.push(newAppointment.id)
    }

    return appointmentIds
}

/**
 * Registra a rota para repetir um agendamento finalizado.
 */
export async function repeatAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/appointments/:id/repeat",
        {
            schema: {
                tags: ["Appointments"],
                summary:
                    "Repeat a finalized appointment with multiple sessions",
                security: [{ bearerAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do agendamento deve ser um UUID"),
                }),
                body: repeatAppointmentSchema,
                response: statusRepeatAppointmentSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string }
                Body: z.infer<typeof repeatAppointmentSchema>
            }>,
            reply
        ) => {
            const { id } = request.params
            const { sessionCount, daysOfWeek } = request.body

            const appointmentIds = await repeatAppointmentLogic(
                id,
                sessionCount,
                daysOfWeek
            )

            return reply.status(201).send({ appointmentIds })
        }
    )
}
