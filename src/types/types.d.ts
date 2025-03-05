// src/types/fastify.d.ts

import type { z } from "zod"
import { type FastifyInstance, FastifyRequest } from "fastify"
import type {
    authLoginSchema,
    createPatientSchema,
    verifyAuthSchema,
} from "../schema/schema"

/**
 * Payload do JWT adicionado ao FastifyRequest pelo middleware de autenticação.
 */
interface JwtPayload {
    id: string
    email: string
}

/**
 * Extende o FastifyRequest para incluir o usuário autenticado.
 */
declare module "fastify" {
    interface FastifyRequest {
        user: JwtPayload
    }
}

/**
 * Tipo para o manipulador de erros do Fastify.
 */
export type FastifyErrorHandler = FastifyInstance["errorHandler"]

/**
 * Tipo inferido do schema de login de autenticação.
 */
export type AuthLogin = z.infer<typeof authLoginSchema>

/**
 * Tipo inferido do schema de criação de paciente.
 */
export type PatientCreate = z.infer<typeof createPatientSchema>

export type User = z.infer<typeof verifyAuthSchema>
