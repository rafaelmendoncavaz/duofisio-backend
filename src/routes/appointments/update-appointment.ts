import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { isBefore, isSameDay } from "date-fns";
import { prisma } from "../../../prisma/db";
import { BadRequest, NotFound } from "../_errors/route-error";
import {
    updateAppointmentSchema,
    statusUpdateAppointmentSchema,
} from "../../schema/appointment";

/**
 * Atualiza uma sessão específica de um agendamento existente e, se necessário, o funcionário no Appointment.
 */
async function updateSessionLogic(
    sessionId: string,
    updates: Partial<{
        appointmentDate: Date;
        duration: number;
        employeeId: string;
        status: string;
        progress: string | null;
    }>
) {
    // Busca a sessão atual com o agendamento relacionado
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { appointment: true },
    });

    if (!session) {
        throw new NotFound("Sessão não encontrada");
    }

    // Prepara os dados atualizados para a sessão
    const updatedData = {
        appointmentDate: updates.appointmentDate ?? session.appointmentDate,
        duration: updates.duration ?? session.duration,
        status: updates.status as
            | "SOLICITADO"
            | "CONFIRMADO"
            | "CANCELADO"
            | "FINALIZADO"
            | undefined,
        progress:
            updates.progress !== undefined
                ? updates.progress
                : session.progress,
    };

    // Validações de data apenas se status não for "FINALIZADO"
    const now = new Date();
    if (
        updatedData.status !== "FINALIZADO" && // Ignora validação se status for FINALIZADO
        isBefore(updatedData.appointmentDate, now) &&
        !isSameDay(updatedData.appointmentDate, now)
    ) {
        throw new BadRequest("A data da sessão deve ser hoje ou no futuro");
    }

    // Usa a data original se status for "FINALIZADO", "CONFIRMADO" ou "CANCELADO" e appointmentDate não foi enviado
    const appointmentDateToSave =
        updatedData.status === "FINALIZADO" ||
        updatedData.status === "CONFIRMADO" ||
        (updatedData.status === "CANCELADO" && !updates.appointmentDate)
            ? session.appointmentDate // Mantém a data original
            : new Date(updatedData.appointmentDate); 

    // Atualiza o Appointment se employeeId for fornecido e diferente do atual
    if (
        updates.employeeId &&
        updates.employeeId !== session.appointment.employeeId
    ) {
        await prisma.appointment.update({
            where: { id: session.appointmentId },
            data: { employeeId: updates.employeeId },
        });
    }

    // Atualiza a sessão
    const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
            appointmentDate: appointmentDateToSave,
            duration: updatedData.duration,
            status: updatedData.status,
            progress: updatedData.progress,
            appointment: {
                update: {
                    updatedAt: new Date(),
                },
            },
        },
    });

    return updatedSession;
}

/**
 * Registra a rota para atualizar uma sessão de um agendamento.
 */
export async function updateAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put(
        "/appointments/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Appointments"],
                summary:
                    "Update an existing session (reschedule, change status, employee, or update progress)",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID da sessão deve ser um UUID"),
                }),
                body: updateAppointmentSchema,
                response: statusUpdateAppointmentSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string };
                Body: z.infer<typeof updateAppointmentSchema>;
            }>,
            reply
        ) => {
            const { id } = request.params;
            const { appointmentDate, duration, employeeId, status, progress } =
                request.body;

            const updates: Partial<{
                appointmentDate: Date;
                duration: number;
                employeeId: string;
                status: string;
                progress: string | null;
            }> = {};

            if (appointmentDate)
                updates.appointmentDate = new Date(appointmentDate);
            if (duration) updates.duration = duration;
            if (employeeId) updates.employeeId = employeeId;
            if (status) updates.status = status;
            if (progress !== undefined) updates.progress = progress;

            await updateSessionLogic(id, updates);

            return reply.status(202).send();
        }
    );
}
