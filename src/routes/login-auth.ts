import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authLoginSchema, statusAuthLoginSchema } from "../schema/schema";
import { prisma } from "../../prisma/db";
import { compare } from "bcryptjs";
import { NotFound, Unauthorized } from "./_errors/route-error";

export async function loginAuth(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/login",
        {
            preHandler: [
                app.csrfProtection,
            ],
            schema: {
                tags: ["Auth Login"],
                summary: "Authenticated login",
                body: authLoginSchema,
                response: statusAuthLoginSchema,
            },
        },
        async (request, reply) => {
            const { email, password } = request.body;

            try {
                const user = await prisma.employees.findUnique({
                    where: {
                        email,
                    },
                    select: {
                        id: true,
                        email: true,
                        password: true,
                    },
                });

                if (!user) {
                    throw new NotFound("Usuário não encontrado");
                }

                const isPasswordValid = await compare(password, user.password);

                if (!isPasswordValid) {
                    throw new Unauthorized("Senha incorreta");
                }

                // Gerar token JWT
                const token = app.jwt.sign(
                    {
                        id: user.id,
                        email: user.email,
                    },
                    {
                        expiresIn: "7d",
                    }
                );

                // Definir cookie HttpOnly
                return reply
                    .setCookie("dfauth", token, {
                        path: "/",
                        httpOnly: true,
                        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                        secure: process.env.NODE_ENV === "production",
                        maxAge: 7 * 24 * 60 * 60,
                        signed: true,
                    })
                    .status(200)
                    .send({
                        message: "Login efetuado com sucesso!",
                    });
            } catch (error) {
                if (error instanceof NotFound) {
                    return reply.status(404).send({
                        message: error.message,
                    });
                }

                if (error instanceof Unauthorized) {
                    return reply.status(401).send({
                        message: error.message,
                    });
                }

                console.error(error);
                return reply.status(500).send({
                    message: "Erro no servidor",
                });
            }
        }
    );
}
