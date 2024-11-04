import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../middlewares/auth"
import { verifyAuthSchema } from "../schema/schema"
import { Unauthorized } from "./_errors/route-error"

export async function verifyAuth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            "/dashboard/auth",
            {
                schema: {
                    tags: ["Auth Login"],
                    summary: "Auth Verification",
                    response: verifyAuthSchema,
                },
            },
            async (request, response) => {
                const id = await request.getCurrentUserId()

                const validate = await request.getValidatedUser(id)

                if (!validate) throw new Unauthorized("Usuário inválido")

                return response.send({
                    authenticated: true,
                    user: {
                        name: validate.name,
                        email: validate.email,
                    },
                })
            }
        )
}
