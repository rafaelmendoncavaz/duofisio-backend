import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import { startOfDay, endOfDay, addDays, endOfMonth } from "date-fns"
import { prisma } from "../../../prisma/db"
import {
    getAppointmentsQuerySchema,
    statusGetAppointmentsSchema,
} from "../../schema/appointment"
import { BadRequest } from "../_errors/route-error"

/**
 * Aplica filtros de data à query de agendamentos.
 */
function applyDateFilter(query: {
    filter?: string
    startDate?: string
    endDate?: string
}) {
    const now = new Date()
    let start: Date
    let end: Date

    if (query.startDate && query.endDate) {
        start = startOfDay(new Date(query.startDate))
        end = endOfDay(new Date(query.endDate))
    } else if (query.filter) {
        switch (query.filter) {
            case "today":
                start = startOfDay(now)
                end = endOfDay(now)
                break
            case "tomorrow":
                start = startOfDay(addDays(now, 1))
                end = endOfDay(addDays(now, 1))
                break
            case "week":
                start = startOfDay(now)
                end = endOfDay(addDays(now, 7))
                break
            case "month":
                start = startOfDay(now)
                end = endOfMonth(now)
                break
            default:
                throw new BadRequest("Filtro inválido")
        }
    } else {
        // Sem filtro: retorna todos os agendamentos
        return {}
    }

    return {
        appointmentDate: {
            gte: start,
            lte: end,
        },
    }
}

/**
 * Busca todos os agendamentos com filtros opcionais de data.
 */
async function getAppointmentsLogic(filterParams: {
    filter?: string
    startDate?: string
    endDate?: string
}) {
    const dateFilter = applyDateFilter(filterParams)

    const appointments = await prisma.appointment.findMany({
        where: dateFilter,
        orderBy: { appointmentDate: "asc" },
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

    return appointments.map(appointment => ({
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        duration: appointment.duration,
        status: appointment.status,
        patient: {
            id: appointment.patient.id,
            name: appointment.patient.name,
            phone: appointment.patient.phone,
        },
        employee: {
            name: appointment.employee.name,
        },
        appointmentReason: {
            cid: appointment.clinicalRecord.cid,
            allegation: appointment.clinicalRecord.allegation,
            diagnosis: appointment.clinicalRecord.diagnosis,
        },
    }))
}

/**
 * Registra a rota para obter a lista de agendamentos.
 */
export async function getAppointments(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/appointments",
        {
            schema: {
                tags: ["Appointments"],
                summary:
                    "Get a list of appointments with optional date filters",
                security: [{ bearerAuth: [] }],
                querystring: getAppointmentsQuerySchema,
                response: statusGetAppointmentsSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: z.infer<typeof getAppointmentsQuerySchema>
            }>,
            reply
        ) => {
            const appointments = await getAppointmentsLogic(request.query)
            return reply.status(200).send({ appointments })
        }
    )
}
