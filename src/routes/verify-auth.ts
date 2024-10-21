import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { auth } from "../middlewares/auth"
import { verifyAuthSchema } from "../schema/schema"

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
                const h = request.headers
                console.log(h)
                return response.send({
                    authenticated: true,
                })
            }
        )
}
