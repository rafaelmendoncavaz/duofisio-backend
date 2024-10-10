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
    expires: z.coerce.date().optional(),
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
        email: z.string().email(),
        address: addressSchema,
    })
    .optional()

// Create Patient Data
export const createPatientSchema = z.object({
    name: z.string(),
    cpf: z.string(),
    dateOfBirth: z.coerce.date(),
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

// Get Patient Data
export const statusGetPatientsSchema = {
    200: z.object({
        patients: z.array(
            z.object({
                id: z.string().uuid(),
                name: z.string(),
                phone: z.string().nullable(),
                sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).nullable(),
                appointments: z.array(
                    z.object({
                        status: z.union([
                            z.literal("SOLICITADO"),
                            z.literal("CONFIRMADO"),
                            z.literal("CANCELADO"),
                            z.literal("FINALIZADO"),
                        ]),
                        appointmentDate: z.coerce.date(),
                        employee: z.object({
                            name: z.string(),
                        }),
                    })
                ),
            })
        ),
    }),
}

export const getPatientDataSchema = z.object({
    id: z.string().uuid(),
})

export const statusPatientDataSchema = {
    200: z.object({
        patient: z.object({
            id: z.string().uuid(),
            name: z.string(),
            cpf: z.string(),
            dateOfBirth: z.coerce.date(),
            phone: z.string().nullable(),
            email: z.string().email().nullable(),
            sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).nullable(),
            profession: z.string().nullable(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
            address: z.object({
                cep: z.string(),
                street: z.string(),
                number: z.coerce.number(),
                complement: z.string().nullable(),
                neighborhood: z.string(),
                city: z.string(),
                state: z.string(),
            }),
            adultResponsible: z
                .object({
                    name: z.string(),
                    cpf: z.string(),
                    phone: z.string(),
                    email: z.string().email(),
                    address: z.object({
                        cep: z.string(),
                        street: z.string(),
                        number: z.coerce.number(),
                        complement: z.string().nullable(),
                        neighborhood: z.string(),
                        city: z.string(),
                        state: z.string(),
                    }),
                })
                .nullable(),
            clinicalData: z.array(
                z.object({
                    id: z.string().uuid(),
                    cid: z.string(),
                    covenant: z.string().nullable(),
                    expires: z.coerce.date().nullable(),
                    CNS: z.coerce.number().nullable(),
                    allegation: z.string(),
                    diagnosis: z.string(),
                })
            ),
            appointments: z.array(
                z.object({
                    id: z.string().uuid(),
                    appointmentDate: z.coerce.date(),
                    status: z.union([
                        z.literal("SOLICITADO"),
                        z.literal("CONFIRMADO"),
                        z.literal("CANCELADO"),
                        z.literal("FINALIZADO"),
                    ]),
                    createdAt: z.coerce.date(),
                    updatedAt: z.coerce.date(),
                })
            ),
        }),
    }),
}

// Update Patient Data
export const updatePatientSchema = z.object({
    name: z.string(),
    cpf: z.string(),
    dateOfBirth: z.coerce.date(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).optional(),
    profession: z.string().optional(),
    address: addressSchema,
    adultResponsible: adultResponsibleSchema,
})
