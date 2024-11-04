import type { FastifyInstance } from "fastify"
import type { TypeUserPayload } from "../types/types"
import { fastifyPlugin } from "fastify-plugin"
import { prisma } from "../../prisma/db"
import { Unauthorized } from "../routes/_errors/route-error"

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
    app.addHook("preHandler", async request => {
        const token = request.cookies.authToken
        console.log(`cookie: ${token}`)

        if (!token) throw new Unauthorized("Invalid Access Token")

        request.getCurrentUserId = async () => {
            try {
                const { sub } = await request.jwtVerify<TypeUserPayload>()

                return sub
            } catch {
                throw new Unauthorized("Error verifying token")
            }
        }

        request.getValidatedUser = async () => {
            const id = await request.getCurrentUserId()

            const employee = await prisma.employees.findFirst({
                where: {
                    id,
                },
            })

            if (!employee) throw new Unauthorized("Usuário inválido")

            const { name, email } = employee

            request.user = {
                name,
                email,
            }

            return {
                name,
                email,
            }
        }
    })
})
