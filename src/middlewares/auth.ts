import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { TypeUserPayload } from "../types/types"

export async function auth(app: FastifyInstance) {
    app.decorate("authenticate", async (request: FastifyRequest, response: FastifyReply) => {
        try {
            await request.jwtVerify<TypeUserPayload>()
        } catch (err) {
            response.send(err)
        }
    })
}
