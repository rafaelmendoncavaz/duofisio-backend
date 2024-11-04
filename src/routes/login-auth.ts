import type { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"
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

            const cookie = fastifyCookie.serialize("authToken", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60,
                path: "/dashboard",
                sameSite: true,
                secure: true,
            })

            response.header("set-cookie", cookie)

            response.setCookie("authToken", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60,
                path: "/dashboard",
                sameSite: true,
                signed: true,
                secure: true,
            })

            return response.status(201).send({
                token,
            })
        }
    )
}
