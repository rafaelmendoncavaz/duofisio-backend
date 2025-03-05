import { z } from "zod"

/**
 * Schema para criar um novo agendamento.
 */
export const createAppointmentSchema = z.object({
    appointmentDate: z.coerce.date(),
    status: z.union([z.literal("SOLICITADO"), z.literal("CONFIRMADO")]),
    patient: z.object({
        id: z.string().uuid("ID do paciente deve ser um UUID"),
        name: z.string(),
        cpf: z.string(),
    }),
    employee: z.object({
        name: z.string(),
        id: z.string().uuid("ID do funcionário deve ser um UUID"),
    }),
    reason: z.object({
        cid: z.string(),
    }),
    duration: z
        .number()
        .min(30, "A duração mínima é 30 minutos")
        .multipleOf(30, "A duração deve ser em intervalos de 30 minutos"),
    clinicalRecordId: z
        .string()
        .uuid("ID do registro clínico deve ser um UUID"),
})

/**
 * Schema de resposta para criação de agendamento.
 */
export const statusCreateAppointmentSchema = {
    201: z.object({
        appointmentId: z.string().uuid("ID do agendamento deve ser um UUID"),
    }),
    500: z.object({
        message: z.string(),
    }),
}

/**
 * Schema para a repetição de agendamento.
 */
export const repeatAppointmentSchema = z.object({
    sessionCount: z
        .number()
        .min(1, "Deve haver pelo menos 1 sessão")
        .int("A quantidade de sessões deve ser um número inteiro"),
    daysOfWeek: z
        .array(
            z
                .number()
                .min(0)
                .max(
                    6,
                    "Os dias da semana devem ser de 0 a 6 (domingo a sábado)"
                )
        )
        .min(1, "Selecione pelo menos um dia da semana"),
})

/**
 * Schema de resposta para repetição de agendamento.
 */
export const statusRepeatAppointmentSchema = {
    201: z.object({
        appointmentIds: z.array(
            z.string().uuid("ID do agendamento deve ser um UUID")
        ),
    }),
    400: z.object({
        message: z.string(),
    }),
    404: z.object({
        message: z.string(),
    }),
}

/**
 * Schema para query params (filtros de data).
 */
export const getAppointmentsQuerySchema = z
    .object({
        filter: z.enum(["today", "tomorrow", "week", "month"]).optional(),
        startDate: z.string().datetime({ offset: true }).optional(),
        endDate: z.string().datetime({ offset: true }).optional(),
    })
    .refine(
        data => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate) <= new Date(data.endDate)
            }
            return true
        },
        { message: "startDate deve ser anterior ou igual a endDate" }
    )

/**
 * Schema de resposta para lista de agendamentos.
 */
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
                id: z.string().uuid("ID do agendamento deve ser um UUID"),
                appointmentDate: z.coerce.date(),
                duration: z.number(),
                employee: z.object({
                    name: z.string(),
                }),
                patient: z.object({
                    id: z.string().uuid("ID do paciente deve ser um UUID"),
                    name: z.string(),
                    phone: z.string().nullable(),
                }),
                appointmentReason: z.object({
                    cid: z.string(),
                    allegation: z.string(),
                    diagnosis: z.string(),
                }),
            })
        ),
    }),
    500: z.object({
        message: z.string(),
    }),
}

/**
 * Schema de resposta para um agendamento específico de um paciente.
 */
export const statusGetSinglePatientAppointments = {
    200: z.object({
        appointment: z.object({
            id: z.string().uuid("ID do agendamento deve ser um UUID"),
            appointmentDate: z.coerce.date(),
            duration: z.number(),
            status: z.union([
                z.literal("SOLICITADO"),
                z.literal("CONFIRMADO"),
                z.literal("CANCELADO"),
                z.literal("FINALIZADO"),
            ]),
            employee: z.object({
                employeeName: z.string(),
                employeeId: z
                    .string()
                    .uuid("ID do funcionário deve ser um UUID"),
            }),
            appointmentReason: z.object({
                cid: z.string(),
                allegation: z.string(),
                diagnosis: z.string(),
            }),
            patient: z.object({
                name: z.string(),
                phone: z.string().nullable(),
                email: z.string().email().nullable(),
                patientId: z.string().uuid("ID do paciente deve ser um UUID"),
            }),
        }),
    }),
    404: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
}

/**
 * Schema para atualizar um agendamento.
 */
export const updateAppointmentSchema = z.object({
    appointmentDate: z.coerce.date().optional(),
    duration: z
        .number()
        .min(30, "A duração mínima é 30 minutos")
        .multipleOf(30, "A duração deve ser em intervalos de 30 minutos")
        .optional(),
    status: z
        .union([
            z.literal("SOLICITADO"),
            z.literal("CONFIRMADO"),
            z.literal("CANCELADO"),
            z.literal("FINALIZADO"),
        ])
        .optional(),
    employee: z
        .object({
            employeeName: z.string(),
            employeeId: z.string().uuid("ID do funcionário deve ser um UUID"),
        })
        .optional(),
})

/**
 * Schema de resposta para atualização de agendamento.
 */
export const statusUpdateAppointmentSchema = {
    204: z.null(),
    404: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
}

/**
 * Schema de resposta para exclusão de agendamento.
 */
export const statusDeleteAppointmentSchema = {
    204: z.null(),
    404: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
}
