import { z } from "zod";

/**
 * Schema para criar um novo agendamento.
 */
export const createAppointmentSchema = z.object({
    appointmentDate: z.string().datetime({ offset: true }),
    duration: z
        .number()
        .min(30, "A duração mínima é 30 minutos")
        .multipleOf(30, "A duração deve ser em intervalos de 30 minutos"),
    totalSessions: z
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
        .optional(),
    patientId: z.string().uuid("ID do paciente deve ser um UUID"),
    employeeId: z.string().uuid("ID do funcionário deve ser um UUID"),
    clinicalRecordId: z
        .string()
        .uuid("ID do registro clínico deve ser um UUID"),
});

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
};

/**
 * Schema para a repetição de agendamento.
 */
export const repeatAppointmentSchema = z.object({
    totalSessions: z
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
});

/**
 * Schema de resposta para repetição de agendamento.
 */
export const statusRepeatAppointmentSchema = {
    201: z.object({
        appointmentId: z
            .string()
            .uuid("ID do novo agendamento deve ser um UUID"),
        sessionIds: z.array(
            z.string().uuid("ID do agendamento deve ser um UUID")
        ),
    }),
    400: z.object({
        message: z.string(),
    }),
    404: z.object({
        message: z.string(),
    }),
};

/**
 * Schema de resposta para lista de agendamentos.
 */
export const statusGetAppointmentsSchema = {
    200: z.object({
        appointments: z.array(
            z.object({
                id: z.string().uuid("ID do agendamento deve ser um UUID"),
                totalSessions: z.number(),
                createdAt: z.date(),
                updatedAt: z.date(),
                patient: z.object({
                    id: z.string().uuid("ID do paciente deve ser um UUID"),
                    name: z.string(),
                    phone: z.string().nullable(),
                }),
                employee: z.object({
                    name: z.string(),
                    id: z.string().uuid(),
                }),
                appointmentReason: z.object({
                    id: z.string().uuid(),
                    cid: z.string(),
                    allegation: z.string(),
                    diagnosis: z.string(),
                }),
                sessions: z.array(
                    z.object({
                        id: z.string().uuid("ID da sessão deve ser um UUID"),
                        sessionNumber: z.number(),
                        status: z.union([
                            z.literal("SOLICITADO"),
                            z.literal("CONFIRMADO"),
                            z.literal("CANCELADO"),
                            z.literal("FINALIZADO"),
                        ]),
                        appointmentDate: z.string(),
                        duration: z.number(),
                        progress: z.string().nullable(),
                    })
                ),
            })
        ),
    }),
    500: z.object({
        message: z.string(),
    }),
};

/**
 * Schema de resposta para um agendamento específico de um paciente.
 */
export const statusGetSinglePatientAppointments = {
    200: z.object({
        session: z.object({
            id: z.string().uuid("ID do agendamento deve ser um UUID"),
            appointmentDate: z.string(),
            duration: z.number(),
            status: z.union([
                z.literal("SOLICITADO"),
                z.literal("CONFIRMADO"),
                z.literal("CANCELADO"),
                z.literal("FINALIZADO"),
            ]),
            sessionNumber: z.number(),
            progress: z.string().nullable(),
            appointment: z.object({
                id: z.string().uuid("ID do agendamento deve ser um UUID"),
                totalSessions: z.number(),
                createdAt: z.date(),
                updatedAt: z.date(),
                patient: z.object({
                    patientId: z
                        .string()
                        .uuid("ID do paciente deve ser um UUID"),
                    name: z.string(),
                    phone: z.string().nullable(),
                    email: z.string().email().nullable(),
                }),
                employee: z.object({
                    employeeId: z
                        .string()
                        .uuid("ID do funcionário deve ser um UUID"),
                    employeeName: z.string(),
                }),
                appointmentReason: z.object({
                    id: z.string().uuid(),
                    cid: z.string(),
                    allegation: z.string(),
                    diagnosis: z.string(),
                }),
            }),
        }),
    }),
    404: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
};

/**
 * Schema para atualizar um agendamento.
 */
export const updateAppointmentSchema = z.object({
    appointmentDate: z.string().datetime({ offset: true }).optional(),
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
    progress: z.string().nullable().optional(),
    employeeId: z
        .string()
        .uuid("ID do funcionário deve ser um UUID")
        .optional(),
});

/**
 * Schema de resposta para atualização de agendamento.
 */
export const statusUpdateAppointmentSchema = {
    202: z.null(),
    404: z.object({
        message: z.string(),
    }),
    500: z.object({
        message: z.string(),
    }),
};

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
};
