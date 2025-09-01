import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getSingleEmployeeSchema } from "../../schema/employee";
import { prisma } from "../../../prisma/db";
import { NotFound } from "../_errors/route-error";
import { z } from "zod";

/**
 * Exibe um funcionario especifico.
 */
async function getEmployeeLogic(id: string) {
    const employee = await prisma.employees.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            name: true,
        }
    })

    if (!employee)
        throw new NotFound("Usuario nao encontrado!");

    return employee;
}

/**
 * Registra a rota para buscar funcionario especifico.
 */
export async function getEmployee(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/employee/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Employees"],
                summary: "Get a specific employee",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID do funcionario deve ser um UUID"),
                }),
                response: getSingleEmployeeSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { id: string };
            }>,
            reply
        ) => {
            const { id } = request.params;
            const employee = await getEmployeeLogic(id);
            
            return reply.status(200).send({ employee });
        }
    );
}
