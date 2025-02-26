import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { authLoginSchema, statusAuthLoginSchema } from "../schema/schema"
import { prisma } from "../../prisma/db"
import { compare } from "bcrypt"
import { NotFound, Unauthorized } from "./_errors/route-error"

export async function loginAuth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/login",
        {
            schema: {
                tags: ["Auth Login"],
                summary: "Authenticated login",
                body: authLoginSchema,
                response: statusAuthLoginSchema,
            },
        },
        async (request, response) => {
            const { email, password } = authLoginSchema.parse(request.body)

            try {
                const user = await prisma.employees.findUnique({
                    where: {
                        email,
                    },
                })

                if (!user) {
                    throw new NotFound("Usuário não encontrado")
                }

                const isPasswordValid = await compare(password, user.password)

                if (!isPasswordValid) {
                    throw new Unauthorized("Senha incorreta")
                }

                // Gera o token JWT
                const token = await response.jwtSign(
                    {
                        id: user.id,
                        email: user.email,
                    },
                    {
                        expiresIn: "24h",
                    }
                )

                return response.status(200).send({
                    token,
                })
            } catch (error) {
                if (error instanceof NotFound) {
                    return response.status(404).send({
                        message: error.message,
                    })
                }

                if (error instanceof Unauthorized) {
                    return response.status(401).send({
                        message: error.message,
                    })
                }

                console.error(error)
                return response.status(500).send({
                    message: "Erro no servidor",
                })
            }
        }
    )
}
