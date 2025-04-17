import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { statusCSRFTokenSchema } from "../schema/schema"

export async function csrfAuth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/csrf-token",
        {
            schema: {
                tags: ["Auth Login"],
                summary: "Generate CSRF Token",
                response: statusCSRFTokenSchema,
            },
        },
        async (request, reply) => {
            try {
                const token = await reply.generateCsrf()
                const secret = request.cookies.csrfToken || "N/A"

                console.log("CSRF Secret gerado:", secret)
                console.log("CSRF Token gerado:", token)

                return reply.status(201).send({ csrfToken: token })
            } catch (error) {
                app.log.error("Erro ao gerar CSRF Token: ", error)
                return reply
                    .status(500)
                    .send({ message: "Erro ao gerar CSRF Token" })
            }
        }
    )
}
