import "fastify"
import type z from "zod"
import type { authLoginSchema, createPatientSchema } from "../schema/schema"
import type { FastifyInstance } from "fastify"

declare module "fastify" {
    interface FastifyRequest {
        user: {
            id: string
        }
        getCurrentUserId(): Promise<string>
        getValidatedUser(): Promise<void>
    }
}
export interface TypeUserPayload {
    subject: string
}

export type FastifyErrorHandler = FastifyInstance["errorHandler"]
export type TypeAuthLogin = z.infer<typeof authLoginSchema>
export type TypePatient = z.infer<typeof createPatientSchema>
