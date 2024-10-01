import type z from "zod"
import type { authLoginSchema } from "../schema/schema"

export interface TypeUserPayload {
    id: string
    email: string
}

export type TypeAuthLogin = z.infer<typeof authLoginSchema>
