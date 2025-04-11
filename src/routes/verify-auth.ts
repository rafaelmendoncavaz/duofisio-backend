import type { FastifyPluginAsync } from "fastify"
import { auth } from "../middlewares/auth"
import { prisma } from "../../prisma/db"
import { verifyAuthSchema } from "../schema/auth"
import { Unauthorized } from "./_errors/route-error"

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
    })

    return user
}

async function getEmployees() {
    const employees = await prisma.employees.findMany({
        select: {
            name: true,
            id: true,
        },
    })

    return employees
}

export const verifyAuth: FastifyPluginAsync = async app => {
    app.get(
        "/verify",
        {
            preHandler: [auth],
            schema: {
                tags: ["Auth Login"],
                summary: "Authenticated login",
                response: verifyAuthSchema,
            },
        },
        async (request, reply) => {
            // request.user contém o payload do JWT após o jwtVerify
            const userId = request.user.id

            const user = await getUserById(userId)

            if (!user)
                throw new Unauthorized("Erro ao buscar o token de autorização")

            const employees = await getEmployees()

            return reply.status(200).send({
                message: "Autenticado",
                user,
                employees,
            })
        }
    )
}
