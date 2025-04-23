import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../prisma/db";
import { verifyAuthSchema } from "../schema/auth";
import { NotFound, Unauthorized } from "./_errors/route-error";

async function getUserById(userId: string) {
    const user = await prisma.employees.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            appointments: {
                select: {
                    id: true,
                    totalSessions: true,
                    patient: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                    clinicalRecord: {
                        select: {
                            cid: true,
                        },
                    },
                    sessions: {
                        select: {
                            id: true,
                            status: true,
                            duration: true,
                            sessionNumber: true,
                            appointmentDate: true,
                        },
                    },
                },
            },
        },
    });

    return user;
}

async function getEmployees() {
    const employees = await prisma.employees.findMany({
        select: {
            name: true,
            id: true,
        },
    });

    return employees;
}

export const verifyAuth: FastifyPluginAsync = async (app) => {
    app.get(
        "/verify",
        {
            preHandler: [app.authenticate],
            schema: {
                tags: ["Auth Login"],
                summary: "Authenticated login",
                response: verifyAuthSchema,
            },
        },
        async (request, reply) => {
            try {
                await request.jwtVerify();
                const { user } = request;

                if (!user) throw new NotFound("Usuário não encontrado");

                const userId = user.id;

                const loggingUser = await getUserById(userId);

                if (!loggingUser)
                    throw new Unauthorized(
                        "Erro ao buscar o token de autorização"
                    );

                const employees = await getEmployees();

                return reply.status(200).send({
                    message: "Autenticado",
                    user: loggingUser,
                    employees,
                });
            } catch (error) {
                if (error instanceof Unauthorized) {
                    return reply
                        .status(401)
                        .send({ message: "Token inválido ou ausente" });
                }
                return reply.status(500).send({ message: "Erro interno" });
            }
        }
    );
};
