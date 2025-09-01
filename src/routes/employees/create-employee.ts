import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type z from "zod";
import { createEmployeeSchema } from "../../schema/employee";
import { prisma } from "../../../prisma/db";
import { BadRequest, Unauthorized } from "../_errors/route-error";
import { hash } from "bcryptjs";

/**
 * Cria um novo funcionario, com ou sem privilegios.
 */
async function createEmployeeLogic(
    userId: string,
    name: string,
    email: string,
    password: string,
    isAdmin: boolean,
) {
    const checkForPrivileges = await prisma.employees.findUnique({
        where: {
            id: userId,
        }
    })

    if (checkForPrivileges) {
        if (!checkForPrivileges.isAdmin)
            throw new Unauthorized("Voce nao possui privilegios para criar um novo usuario!");
    }

    const checkForEmail = await prisma.employees.findFirst({
        where: {
            email,
        }
    })

    if (checkForEmail)
        throw new BadRequest("Email ja esta sendo utilizado por outro funcionario!");

    const hashPassword = await hash(password, 6);

    await prisma.employees.create({
        data: {
            name,
            email,
            password: hashPassword,
            isAdmin,
        }
    })
}

/**
 * Registra a rota para criar um novo funcionario.
 */
export async function createEmployee(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/employee",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Employees"],
                summary: "Create a new employee with or without privileges",
                security: [{ cookieAuth: [] }],
                body: createEmployeeSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof createEmployeeSchema>;
            }>,
            reply
        ) => {
            const { name, email, password, isAdmin } = request.body;
            const userId = request.user.id;

            await createEmployeeLogic(userId, name, email, password, isAdmin);

            return reply.status(201).send();
        }
    );
}
