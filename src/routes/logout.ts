import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { authLoginSchema, statusLogoutSchema } from "../schema/schema";

export async function logOut(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/logout",
        {
            preHandler: [app.csrfProtection],
            schema: {
                tags: ["Auth Login"],
                summary: "Logout and Clear Cookie",
                response: statusLogoutSchema,
            },
        },
        async (request, reply) => {
            return reply
                .clearCookie("dfauth", { path: "/" })
                .status(200)
                .send({ message: "Logout efetuado com sucesso!" });
        }
    );
}
