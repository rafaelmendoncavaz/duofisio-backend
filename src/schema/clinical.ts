import { z } from "zod";
import { clinicalDataSchema } from "./common";

/**
 * Schema para criar um novo registro clínico.
 */
export const createNewPatientClinicalRecordSchema = z.object({
    cid: z.string().min(1, "Insira o código do CID"),
    CNS: z.string().nullable(),
    covenant: z.string().nullable(),
    expires: z.coerce.date().nullable(),
    allegation: z.string().min(1, "Insira a queixa do paciente"),
    diagnosis: z.string().min(1, "Insira o diagnóstico"),
});

/**
 * Schema para criar um novo registro clínico.
 */
export const createNewClinicalRecordSchema = z.object({
    cid: z.string().min(1, "Insira o código do CID"),
    covenant: z.string().nullable(),
    expires: z.coerce.date().nullable(),
    allegation: z.string().min(1, "Insira a queixa do paciente"),
    diagnosis: z.string().min(1, "Insira o diagnóstico"),
});

/**
 * Schema de resposta para criação de registro clínico.
 */
export const statusClinicalRecordCreatedSchema = {
    201: z.object({
        message: z.string(),
    }),
};

/**
 * Schema de resposta para lista de registros clínicos.
 */
export const statusGetClinicalRecordListSchema = {
    200: z.object({
        patientClinicalRecord: z.object({
            clinicalRecordList: z.array(clinicalDataSchema),
            patientName: z.string(),
            patientId: z.string().uuid(),
        }),
    }),
};

/**
 * Schema de resposta para um registro clínico específico.
 */
export const statusGetSingleClinicalRecordSchema = {
    200: z.object({
        clinicalRecord: clinicalDataSchema.extend({
            id: z.string().uuid(),
            patientId: z.string().uuid(),
        }),
    }),
};
