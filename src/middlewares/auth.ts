import type { FastifyRequest, FastifyReply } from "fastify"

export async function auth(request: FastifyRequest, reply: FastifyReply) {
    try {
        // Verifica o token JWT enviado no header Authorization
        await request.jwtVerify()
        // O Payload decodificado estará disponível em request.user
    } catch (error) {
        reply.status(401).send({
            message: "Token Não autorizado",
        })
    }
}
