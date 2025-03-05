import type { FastifyPluginAsync } from "fastify"
import { auth } from "../middlewares/auth"
import { prisma } from "../../prisma/db"
import { verifyAuthSchema } from "../schema/auth"

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
                    patient: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                    status: true,
                },
            },
        },
    })

    return user
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

            return reply.status(200).send({
                message: "Autenticado",
                user,
            })
        }
    )
}
