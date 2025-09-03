import { z } from "zod";

/**
 * Schema para o corpo da requisição de login.
 */
export const authLoginSchema = z.object({
    email: z.string().email("Insira um e-mail válido"),
    password: z.string().min(1, "Insira a senha"),
});

/**
 * Schemas de resposta para a rota de login.
 */
export const statusAuthLoginSchema = {
    200: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
};

export const statusLogoutSchema = {
    200: z.object({
        message: z.string(),
    }),
};

export const statusCSRFTokenSchema = {
    201: z.object({
        csrfToken: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
};

/**
 * Schema de resposta para verificar autenticação.
 */
export const verifyAuthSchema = {
    200: z.object({
        message: z.string(),
        user: z.object({
            name: z.string(),
            id: z.string().uuid(),
            isAdmin: z.boolean(),
            appointments: z.array(
                z.object({
                    id: z.string().uuid(),
                    totalSessions: z.number(),
                    patient: z.object({
                        name: z.string(),
                        id: z.string().uuid(),
                    }),
                    clinicalRecord: z.object({
                        cid: z.string(),
                    }),
                    sessions: z.array(
                        z.object({
                            id: z.string().uuid(),
                            sessionNumber: z.number(),
                            appointmentDate: z.date(),
                            status: z.union([
                                z.literal("SOLICITADO"),
                                z.literal("CONFIRMADO"),
                                z.literal("CANCELADO"),
                                z.literal("FINALIZADO"),
                            ]),
                            duration: z.number(),
                        })
                    ),
                })
            ),
        }),
        employees: z.array(
            z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string().email(),
                isAdmin: z.boolean(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
            })
        ),
    }),
    401: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
};

/**
 * Schema para dados de um funcionário.
 */
export const employeeSchema = z.object({
    email: z.string().email("Insira um e-mail válido"),
    password: z.string().min(1, "Insira a senha"),
    name: z.string().min(1, "Insira o nome do funcionário"),
    id: z.string().uuid(), // UUID
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});
