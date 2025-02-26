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
            const { email, password } = request.body

            const employee = await prisma.employees.findUnique({
                where: {
                    email,
                },
            })

            if (!employee) {
                throw new NotFound("Usuário não encontrado!")
            }

            const validatePassword = await compare(password, employee.password)

            if (!validatePassword) {
                throw new Unauthorized("Senha inválida!")
            }

            const token = await response.jwtSign(
                {
                    sub: employee.id,
                },
                {
                    sign: {
                        expiresIn: "7d",
                    },
                }
            )

            return response.status(201).send({
                token,
            })
        }
    )
}
