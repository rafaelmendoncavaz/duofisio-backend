import type { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"
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

            const cookie = fastifyCookie.serialize("authToken", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60,
                path: "/dashboard",
                sameSite: "strict",
            })

            response.header("Set-Cookie", cookie)

            return response.status(201).send({
                token,
            })
        }
    )
}
