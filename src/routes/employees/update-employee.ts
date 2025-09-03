import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { updateEmployeeSchema } from "../../schema/employee";
import { prisma } from "../../../prisma/db";
import { BadRequest, Unauthorized } from "../_errors/route-error";
import { hash } from "bcryptjs";

/**
 * Atualiza um funcionario funcionario, com ou sem privilegios.
 */
async function updateEmployeeLogic(
    userId: string,
    id: string,
    updates: Partial<{
        email: string,
        password: string,
        isAdmin: boolean,
    }>
) {
    const checkForPrivileges = await prisma.employees.findUnique({
            where: {
                id: userId,
            }
        })
    
    if (checkForPrivileges) {
        if (!checkForPrivileges.isAdmin)
            throw new Unauthorized("Voce nao possui privilegios para atualizar um usuario!");
    }

    if (userId === id && !updates.isAdmin)
        throw new BadRequest("Voce nao pode retirar seus proprios privilegios!");

    const employee = await prisma.employees.findUnique({
        where: {
            id,
        }
    })

    if (!employee)
        throw new BadRequest("Nao foi possivel encontrar o usuario a ser editado.");

    if (updates.email) {
        const checkForEmail = await prisma.employees.findFirst({
            where: {
                email: updates.email,
            }
        })
        if (checkForEmail)
            throw new BadRequest("Email ja esta sendo utilizado por outro funcionario!");
    }

    if (updates) {
        await prisma.employees.update({
            where: {
                id,
            },
            data: updates,
        })
    }
}

/**
 * Registra a rota para atualizar um funcionario existente.
 */
export async function updateEmployee(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().patch(
        "/employee/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Employees"],
                summary: "Updates an employee with or without privileges",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do funcionario deve ser um UUID"),
                }),
                body: updateEmployeeSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string };
                Body: z.infer<typeof updateEmployeeSchema>;
            }>,
            reply
        ) => {
            const { id } = request.params;
            const userId = request.user.id;
            const { email, password, isAdmin } = request.body;

            const updates: Partial<{
                email: string,
                password: string,
                isAdmin: boolean,
            }> = {};

            if (email !== undefined) updates.email = email;
            if (password !== undefined) updates.password = await hash(password, 6);
            if (isAdmin !== undefined) updates.isAdmin = isAdmin;

            await updateEmployeeLogic(userId, id, updates);

            return reply.status(204).send();
        }
    );
}
