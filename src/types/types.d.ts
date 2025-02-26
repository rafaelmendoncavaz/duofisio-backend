import "fastify"
import type z from "zod"
import type { authLoginSchema, createPatientSchema } from "../schema/schema"
import type { FastifyInstance } from "fastify"
export interface TypeUserPayload {
    sub: string
}

interface JwtPayload {
    id: number
    email: string
}

declare module "fastify" {
    interface FastifyRequest {
        user: JwtPayload
    }
}

export type FastifyErrorHandler = FastifyInstance["errorHandler"]
export type TypeAuthLogin = z.infer<typeof authLoginSchema>
export type TypePatient = z.infer<typeof createPatientSchema>
