import { z } from "zod";
import {
    addressSchema,
    adultResponsibleSchema,
    clinicalDataSchema,
} from "./common";
import { createNewPatientClinicalRecordSchema } from "./clinical";

/**
 * Schema para criar um novo paciente.
 */
export const createPatientSchema = z.object({
    name: z.string().min(2, "Insira o nome do paciente"),
    cpf: z.string().length(11, "O CPF deve ter 11 dígitos"),
    dateOfBirth: z.coerce.date(),
    phone: z.string().nullable(),
    email: z.string().email("Insira um e-mail válido").nullable(),
    sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).nullable(),
    profession: z.string().nullable(),
    address: addressSchema,
    clinicalData: createNewPatientClinicalRecordSchema,
    adultResponsible: adultResponsibleSchema,
});

/**
 * Schema de resposta para criação de paciente.
 */
export const statusCreatePatientSchema = {
    201: z.object({
        patientId: z.string().uuid(), // UUID
    }),
};

/**
 * Schema para atualizar dados de um paciente.
 */
export const updatePatientSchema = z.object({
    name: z.string().min(2, "Insira o nome do paciente"),
    cpf: z.string().length(11, "O CPF deve ter 11 dígitos"),
    dateOfBirth: z.coerce.date(),
    phone: z.string().nullable(),
    email: z.string().email("Insira um e-mail válido").nullable(),
    sex: z.union([z.literal("Masculino"), z.literal("Feminino")]).nullable(),
    profession: z.string().nullable(),
    address: addressSchema,
    adultResponsible: adultResponsibleSchema,
});

/**
 * Schema para parâmetros de busca de paciente.
 */
export const getPatientDataSchema = z.object({
    id: z.string().uuid(), // UUID
    recordId: z.string().uuid().optional(), // UUID
});

/**
 * Schema de resposta para lista de pacientes.
 */
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
                        id: z.string().uuid(),
                        totalSessions: z.number(),
                        sessions: z.array(
                            z.object({
                                id: z.string().uuid(),
                                status: z.union([
                                    z.literal("SOLICITADO"),
                                    z.literal("CONFIRMADO"),
                                    z.literal("CANCELADO"),
                                    z.literal("FINALIZADO"),
                                ]),
                                appointmentDate: z.date(),
                            })
                        ),
                        employee: z.object({
                            name: z.string(),
                        }),
                    })
                ),
            })
        ),
    }),
};

/**
 * Schema de resposta para detalhes de um paciente.
 */
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
            address: addressSchema,
            adultResponsible: adultResponsibleSchema,
            clinicalData: z.array(clinicalDataSchema),
            appointments: z.array(
                z.object({
                    id: z.string().uuid(),
                    createdAt: z.date(),
                    updatedAt: z.date(),
                    totalSessions: z.number(),
                    clinicalRecord: z.object({
                        cid: z.string(),
                        allegation: z.string(),
                        diagnosis: z.string(),
                    }),
                    sessions: z.array(
                        z.object({
                            id: z.string().uuid(),
                            appointmentDate: z.date(),
                            status: z.union([
                                z.literal("SOLICITADO"),
                                z.literal("CONFIRMADO"),
                                z.literal("CANCELADO"),
                                z.literal("FINALIZADO"),
                            ]),
                            duration: z.number(),
                            sessionNumber: z.number(),
                            progress: z.string().nullable(),
                        })
                    ),
                })
            ),
        }),
    }),
};
