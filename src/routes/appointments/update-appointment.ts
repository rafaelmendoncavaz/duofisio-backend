import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { z } from "zod"
import { isBefore, isSameDay, addMinutes } from "date-fns"
import { prisma } from "../../../prisma/db"
import { BadRequest, NotFound } from "../_errors/route-error"
import {
    updateAppointmentSchema,
    statusUpdateAppointmentSchema,
} from "../../schema/appointment"
import type { Prisma } from "@prisma/client"

/**
 * Verifica se há conflito de horário para o funcionário no mesmo dia e intervalo.
 * @throws {BadRequest} Se o funcionário já tiver um agendamento no intervalo, exceto o atual.
 */
async function checkEmployeeAvailability(
    employeeId: string,
    appointmentDate: Date,
    duration: number,
    excludeAppointmentId?: string
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
                id: excludeAppointmentId
                    ? { not: excludeAppointmentId }
                    : undefined, // Exclui o agendamento atual
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
 * Atualiza um agendamento existente com novos dados.
 */
async function updateAppointmentLogic(
    appointmentId: string,
    updates: Partial<{
        appointmentDate: Date
        duration: number
        employeeId: string
        status: string
    }>
) {
    // Busca o agendamento atual
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { employee: true },
    })

    if (!appointment) {
        throw new NotFound("Agendamento não encontrado")
    }

    // Prepara os dados atualizados
    const updatedData = {
        appointmentDate: updates.appointmentDate ?? appointment.appointmentDate,
        duration: updates.duration ?? appointment.duration,
        employeeId: updates.employeeId ?? appointment.employeeId,
        status: updates.status as
            | "SOLICITADO"
            | "CONFIRMADO"
            | "CANCELADO"
            | "FINALIZADO"
            | undefined,
    }

    // Validações
    const now = new Date()
    if (
        isBefore(updatedData.appointmentDate, now) &&
        !isSameDay(updatedData.appointmentDate, now)
    ) {
        throw new BadRequest("A data do agendamento deve ser hoje ou no futuro")
    }

    await checkEmployeeAvailability(
        updatedData.employeeId,
        updatedData.appointmentDate,
        updatedData.duration,
        appointmentId // Exclui o agendamento atual da verificação de conflitos
    )

    // Atualiza o agendamento
    await prisma.appointment.update({
        where: { id: appointmentId },
        data: updatedData,
    })
}

/**
 * Registra a rota para atualizar um agendamento.
 */
export async function updateAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put(
        "/appointments/:id",
        {
            schema: {
                tags: ["Appointments"],
                summary:
                    "Update an existing appointment (reschedule or change status)",
                security: [{ bearerAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do agendamento deve ser um UUID"),
                }),
                body: updateAppointmentSchema,
                response: statusUpdateAppointmentSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string }
                Body: z.infer<typeof updateAppointmentSchema>
            }>,
            reply
        ) => {
            const { id } = request.params
            const { appointmentDate, duration, employee, status } = request.body

            const updates: Partial<{
                appointmentDate: Date
                duration: number
                employeeId: string
                status: string
            }> = {}

            if (appointmentDate) updates.appointmentDate = appointmentDate
            if (duration) updates.duration = duration
            if (employee) updates.employeeId = employee.employeeId
            if (status) updates.status = status

            await updateAppointmentLogic(id, updates)

            return reply.status(204).send()
        }
    )
}
