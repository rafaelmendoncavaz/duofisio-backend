import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { TypeUserPayload } from "../types/types"
import { fastifyPlugin } from "fastify-plugin"
import { prisma } from "../../prisma/db"
import { Unauthorized } from "../routes/_errors/route-error"

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
    app.addHook("preHandler", async request => {
        try {
            const { email, id } = await request.jwtVerify<TypeUserPayload>()

            const employee = await prisma.employees.findFirst({
                where: {
                    id,
                    email,
                },
            })

            if (!employee) {
                throw new Unauthorized("Invalid Access Token")
            }

            request.user = {
                id,
                email,
            }
        } catch {
            throw new Unauthorized("Invalid Access Token")
        }
    })
})
