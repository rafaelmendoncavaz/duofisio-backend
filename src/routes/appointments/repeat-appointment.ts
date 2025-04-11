import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { addDays, isSameDay, isBefore, getDay, set } from "date-fns"
import { prisma } from "../../../prisma/db"
import { BadRequest, NotFound } from "../_errors/route-error"
import {
    repeatAppointmentSchema,
    statusRepeatAppointmentSchema,
} from "../../schema/appointment"

/**
 * Gera datas futuras para as sessões baseadas nos dias da semana e quantidade.
 */
function generateSessionDates(
    lastSessionDate: Date, // Data da última sessão em UTC-3
    lastSessionTime: { hours: number; minutes: number }, // Hora da última sessão
    totalSessions: number,
    daysOfWeek: number[]
): Date[] {
    const sessionDates: Date[] = []
    let currentDate = addDays(lastSessionDate, 1) // Começa no dia seguinte à última sessão
    let sessionsGenerated = 0

    while (sessionsGenerated < totalSessions) {
        const dayOfWeek = getDay(currentDate)
        if (daysOfWeek.includes(dayOfWeek)) {
            if (
                !isBefore(currentDate, new Date()) ||
                isSameDay(currentDate, new Date())
            ) {
                // Aplica a hora da última sessão à nova data
                const sessionDate = set(currentDate, {
                    hours: lastSessionTime.hours,
                    minutes: lastSessionTime.minutes,
                    seconds: 0,
                    milliseconds: 0,
                })
                sessionDates.push(sessionDate)
                sessionsGenerated++
            }
        }
        currentDate = addDays(currentDate, 1) // Avança um dia
    }

    return sessionDates
}

/**
 * Cria um novo agendamento repetindo informações do original e gerando novas sessões.
 */
async function repeatAppointmentLogic(
    appointmentId: string,
    totalSessions: number,
    daysOfWeek: number[]
) {
    // Busca o agendamento original com suas sessões
    const originalAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { sessions: true },
    })

    if (!originalAppointment) {
        throw new NotFound("Agendamento não encontrado")
    }

    // Verifica se todas as sessões existentes estão finalizadas
    const allSessionsFinalized = originalAppointment.sessions.every(
        session =>
            session.status === "FINALIZADO" || session.status === "CANCELADO"
    )
    if (!allSessionsFinalized) {
        throw new BadRequest(
            "A repetição só é permitida para agendamentos com todas as sessões finalizadas ou canceladas"
        )
    }

    // Pega a última sessão como base
    const lastSession = originalAppointment.sessions.sort(
        (a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime()
    )[0]
    const lastSessionDateUTC3 = new Date(
        lastSession.appointmentDate.getTime() - 3 * 60 * 60 * 1000
    ) // Converte de UTC para UTC-3
    const lastSessionTime = {
        hours: lastSessionDateUTC3.getHours(),
        minutes: lastSessionDateUTC3.getMinutes(),
    }

    // Gera as datas das novas sessões
    const sessionDates = generateSessionDates(
        lastSessionDateUTC3,
        lastSessionTime,
        totalSessions,
        daysOfWeek
    )

    // Cria um novo Appointment com as mesmas informações gerais
    const newAppointment = await prisma.appointment.create({
        data: {
            patientId: originalAppointment.patientId,
            employeeId: originalAppointment.employeeId,
            clinicalRecordId: originalAppointment.clinicalRecordId,
            totalSessions, // Total de sessões do novo agendamento
        },
    })

    // Cria as novas sessões vinculadas ao novo Appointment
    const newSessions = await Promise.all(
        sessionDates.map((date, index) => {
            const sessionDateUTC = new Date(date.getTime() + 3 * 60 * 60 * 1000) // Converte para UTC
            return prisma.session.create({
                data: {
                    appointmentId: newAppointment.id,
                    appointmentDate: sessionDateUTC,
                    duration: lastSession.duration, // Usa a duração da última sessão
                    sessionNumber: index + 1, // Começa em 1
                    status: "SOLICITADO",
                    progress: null,
                },
            })
        })
    )

    // Converte as datas de volta para UTC-3 ao retornar
    const sessionsInUtcMinus3 = newSessions.map(session => ({
        ...session,
        appointmentDate: new Date(
            session.appointmentDate.getTime() - 3 * 60 * 60 * 1000
        )
            .toISOString()
            .replace("Z", "-03:00"),
    }))

    return {
        appointmentId: newAppointment.id,
        sessionIds: sessionsInUtcMinus3.map(session => session.id),
    }
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
                summary: "Repeat an existing appointment with new sessions",
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
            const { totalSessions, daysOfWeek } = request.body

            const result = await repeatAppointmentLogic(
                id,
                totalSessions,
                daysOfWeek
            )

            return reply.status(201).send({
                appointmentId: result.appointmentId,
                sessionIds: result.sessionIds,
            })
        }
    )
}
