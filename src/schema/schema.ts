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

// Create Clinical Data
export const clinicalDataSchema = z.object({
    cid: z.string(),
    covenant: z.string().optional(),
    expires: z.date().optional(),
    CNS: z.coerce.number().optional(),
    allegation: z.string(),
    diagnosis: z.string(),
})

// Create Address Data
export const addressSchema = z.object({
    cep: z.string(),
    street: z.string(),
    number: z.coerce.number(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
})

// Create Adult Responsible Data
export const adultResponsibleSchema = z
    .object({
        name: z.string(),
        cpf: z.string(),
        phone: z.string(),
        email: z.string(),
        address: addressSchema,
    })
    .optional()

// Create Patient Data
export const createPatientSchema = z.object({
    name: z.string(),
    cpf: z.string(),
    dateOfBirth: z.date(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).optional(),
    profession: z.string().optional(),
    address: addressSchema,
    clinicalData: clinicalDataSchema,
    adultResponsible: adultResponsibleSchema,
})

export const statusCreatePatientSchema = {
    201: z.object({
        patientId: z.string().uuid(),
    }),
}
