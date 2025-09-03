import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../prisma/db";
import { BadRequest, Unauthorized } from "../_errors/route-error";
import { z } from "zod";

/**
 * Exibe uma lista de funcionarios e seus privilegios.
 */
async function deleteEmployeesLogic(userId: string, id: string) {
    const checkForPrivileges = await prisma.employees.findUnique({
            where: {
                id: userId,
            }
        })
    
    if (checkForPrivileges) {
        if (!checkForPrivileges.isAdmin)
            throw new Unauthorized("Voce nao possui privilegios para deletar um usuario!");
    }

    const checkForAdmin = await prisma.employees.findUnique({
        where: { id },
    })

    if (checkForAdmin) {
        if (checkForAdmin.isAdmin)
            throw new BadRequest("Voce nao pode deletar um outro usuario admin!");
        if (checkForAdmin.id === userId) {
            throw new BadRequest("Voce nao pode deletar seu proprio usuario!");
        }
    }
    
    // Transferir agendamentos do usuario a ser deletado para o usuario que esta deletando
    await prisma.appointment.updateMany({
        where: { id },
        data: {
            employeeId: userId,
        }
    });

    await prisma.employees.delete({
        where: { id },
    });
}

/**
 * Registra a rota para deletar funcionarios existentes.
 */
export async function deleteEmployee(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/employee/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Employees"],
                summary: "Delete a specific employee",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do funcionario deve ser um UUID"),
                }),
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string };
            }>,
            reply
        ) => {
            const { id } = request.params;
            const userId = request.user.id;

            await deleteEmployeesLogic(userId, id);

            return reply.status(204).send();
        }
    );
}
