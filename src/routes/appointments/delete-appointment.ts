import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../prisma/db";
import { NotFound } from "../_errors/route-error";
import { statusDeleteAppointmentSchema } from "../../schema/appointment";

/**
 * Exclui um agendamento específico.
 * @throws {NotFound} Se o agendamento não for encontrado.
 */
async function deleteAppointmentLogic(appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
    });

    if (!appointment) {
        throw new NotFound("Agendamento não encontrado");
    }

    await prisma.appointment.delete({
        where: { id: appointmentId },
    });
}

/**
 * Registra a rota para excluir um agendamento.
 */
export async function deleteAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/appointments/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Appointments"],
                summary: "Delete a specific appointment",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do agendamento deve ser um UUID"),
                }),
                response: statusDeleteAppointmentSchema,
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
            const { id } = request.params;

            await deleteAppointmentLogic(id);

            return reply.status(204).send();
        }
    );
}
