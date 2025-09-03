import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getEmployeesSchema } from "../../schema/employee";
import { prisma } from "../../../prisma/db";
import { formatToISOString } from "../../utils/date";

/**
 * Exibe uma lista de funcionarios e seus privilegios.
 */
async function getEmployeesLogic() {
    const employees = await prisma.employees.findMany({
        orderBy: {
            name: "asc"
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            isAdmin: true,
        }
    })

    return employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        createdAt: formatToISOString(employee.createdAt),
        updatedAt: formatToISOString(employee.updatedAt),
        isAdmin: employee.isAdmin,
    }));
}

/**
 * Registra a rota para buscar funcionarios existentes.
 */
export async function getEmployees(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/employee",
        {
            preHandler: [app.authenticate],
            schema: {
                tags: ["Employees"],
                summary: "Get a list of employees",
                security: [{ cookieAuth: [] }],
                response: getEmployeesSchema,
            },
        },
        async (
            request,
            reply
        ) => {
            
            const employees = await getEmployeesLogic();
            
            return reply.status(200).send({ employees });
        }
    );
}
