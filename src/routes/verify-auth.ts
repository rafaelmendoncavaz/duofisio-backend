import type { FastifyPluginAsync } from "fastify"
import { auth } from "../middlewares/auth"

export const verifyAuth: FastifyPluginAsync = async app => {
    app.get(
        "/verify",
        {
            preHandler: [auth],
        },
        async (request, reply) => {
            // request.user contém o payload do JWT após o jwtVerify
            return reply.status(200).send({
                message: "Autenticado",
                userId: request.user.id,
            })
        }
    )
}
