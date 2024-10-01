import type z from "zod"
import type { authLoginSchema, createPatientSchema } from "../schema/schema"
import type { FastifyInstance } from "fastify"

export interface TypeUserPayload {
    id: string
    email: string
}

export type TypeAuthLogin = z.infer<typeof authLoginSchema>
export type TypePatient = z.infer<typeof createPatientSchema>
export type FastifyErrorHandler = FastifyInstance["errorHandler"]
