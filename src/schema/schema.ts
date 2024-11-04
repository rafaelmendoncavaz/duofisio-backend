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

export const verifyAuthSchema = {
    200: z.object({
        authenticated: z.boolean(),
        user: z.object({
            name: z.string(),
            email: z.string().email(),
        }),
    }),
}

export const employeeSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
    id: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

// Create Clinical Data
export const clinicalDataSchema = z.object({
    cid: z.string().min(1, "Insira o código do CID"),
    covenant: z.string().optional(),
    expires: z.coerce.date().optional(),
    CNS: z.string().optional(),
    allegation: z.string().min(1, "Insira a queixa do paciente"),
    diagnosis: z.string(),
})

// Create Address Data
export const addressSchema = z.object({
    cep: z
        .string()
        .min(8, "Insira o CEP do paciente")
        .max(8, "Somente números"),
    street: z.string().min(3, "Insira o nome da rua"),
    number: z.coerce.number().min(1, "Insira o número da casa"),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, "Insira o nome da região/bairro"),
    city: z.string(),
    state: z.string(),
})

// Create Adult Responsible Data
export const adultResponsibleSchema = z
    .object({
        name: z.string().min(3, "Insira o nome do responsável"),
        cpf: z.string().min(11, "O campo CPF do responsável é obrigatório"),
        phone: z.string().min(9, "Insira um número para contato válido"),
        email: z.string().email().min(7, "Insira um e-mail válido"),
        address: addressSchema,
    })
    .optional()

// Create Patient Data
export const createPatientSchema = z.object({
    name: z.string().min(2, "Insira um nome para o paciente"),
    cpf: z
        .string()
        .min(11, "O campo CPF é obrigatório")
        .max(11, "Somente números"),
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
                cpf: z.string(),
                phone: z.string().nullable(),
                sex: z
                    .union([z.literal("Masculino"), z.literal("Feminino")])
                    .nullable(),
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
    recordId: z.string().uuid().optional(),
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
            sex: z
                .union([z.literal("Masculino"), z.literal("Feminino")])
                .nullable(),
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
                    CNS: z.string().nullable(),
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

// Create an Appointment
export const createAppointmentSchema = z.object({
    appointmentDate: z.coerce.date(),
    status: z.union([z.literal("SOLICITADO"), z.literal("CONFIRMADO")]),
    patient: z.object({
        id: z.string().uuid(),
        name: z.string(),
        cpf: z.string(),
    }),
    employee: z.object({
        name: z.string(),
        id: z.string().uuid(),
    }),
    reason: z.object({
        cid: z.string(),
    }),
})

export const statusCreateAppointmentSchema = {
    201: z.object({
        appointmentId: z.string().uuid(),
    }),
    500: z.object({
        message: z.string(),
    }),
}

// Get Appointments
export const statusGetAppointmentsSchema = {
    200: z.object({
        appointments: z.array(
            z.object({
                status: z.union([
                    z.literal("SOLICITADO"),
                    z.literal("CONFIRMADO"),
                    z.literal("CANCELADO"),
                    z.literal("FINALIZADO"),
                ]),
                id: z.string(),
                appointmentDate: z.coerce.date(),
                employee: z.object({
                    name: z.string(),
                }),
                patient: z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    cpf: z.string(),
                }),
                appointmentReason: z.object({
                    cid: z.string(),
                }),
            })
        ),
    }),
    500: z.object({
        message: z.string(),
    }),
}

// Get Single Patient Appointments
export const statusGetSinglePatientAppointments = {
    200: z.object({
        appointment: z.object({
            appointmentDate: z.coerce.date(),
            status: z.union([
                z.literal("SOLICITADO"),
                z.literal("CONFIRMADO"),
                z.literal("CANCELADO"),
                z.literal("FINALIZADO"),
            ]),
            employee: z.object({
                employeeName: z.string(),
                employeeId: z.string().uuid(),
            }),
            appointmentReason: z.object({
                cid: z.string(),
                diagnosis: z.string(),
            }),
            patient: z.object({
                name: z.string(),
                phone: z.string().nullable(),
                email: z.string().email().nullable(),
                patientId: z.string().uuid(),
            }),
        }),
    }),
    500: z.object({
        message: z.string(),
    }),
}

// Update an appointment
export const updateAppointmentSchema = z.object({
    appointmentDate: z.coerce.date(),
    status: z.union([
        z.literal("SOLICITADO"),
        z.literal("CONFIRMADO"),
        z.literal("CANCELADO"),
        z.literal("FINALIZADO"),
    ]),
    employee: z.object({
        employeeName: z.string(),
        employeeId: z.string().uuid(),
    }),
})

export const statusUpdateAppointmentSchema = {
    204: z.null(),
    500: z.object({
        message: z.string(),
    }),
}

// Create New Clinical Record
export const createNewClinicalRecordSchema = z.object({
    cid: z.string(),
    covenant: z.string().optional(),
    expires: z.coerce.date().optional(),
    allegation: z.string(),
    diagnosis: z.string(),
})

export const statusClinicalRecordCreatedSchema = {
    201: z.object({
        message: z.string(),
    }),
}

// Get Clinical Record List
export const statusGetClinicalRecordListSchema = {
    200: z.object({
        patientClinicalRecord: z.object({
            clinicalRecordList: z.array(
                z.object({
                    id: z.string().uuid(),
                    cid: z.string().min(1, "Insira o código do CID"),
                    covenant: z.string().nullable(),
                    expires: z.coerce.date().nullable(),
                    CNS: z.string().nullable(),
                    allegation: z
                        .string()
                        .min(1, "Insira a queixa do paciente"),
                    diagnosis: z.string(),
                })
            ),
            patientName: z.string(),
            patientId: z.string().uuid(),
        }),
    }),
}

// Get Single Clinical Record
export const statusGetSingleClinicalRecordSchema = {
    200: z.object({
        clinicalRecord: z.object({
            id: z.string().uuid(),
            cid: z.string().min(1, "Insira o código do CID"),
            covenant: z.string().nullable(),
            expires: z.coerce.date().nullable(),
            CNS: z.string().nullable(),
            allegation: z.string().min(1, "Insira a queixa do paciente"),
            diagnosis: z.string(),
            patientId: z.string().uuid(),
        }),
    }),
}
