import { z } from "zod"

// Login
export const authLoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const statusAuthLoginSchema = {
    201: z.object({
        token: z.string(),
    }),
}
