import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { authLoginSchema, statusAuthLoginSchema } from "../schema/schema"
import { prisma } from "../../prisma/db"
import { compare } from "bcrypt"
import { Unauthorized } from "./_errors/route-error"

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

            const employeeMail = await prisma.employees.findUnique({
                where: {
                    email,
                },
            })

            if (!employeeMail || employeeMail.password === null) {
                throw new Unauthorized("Invalid credentials")
            }

            const validatePassword = await compare(password, employeeMail.password)

            if (!validatePassword) {
                throw new Unauthorized("Invalid credentials")
            }

            const token = await response.jwtSign(
                {
                    subject: employeeMail.id,
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
