import type { FastifyInstance, FastifyRequest } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import type { z } from "zod"
import { prisma } from "../../../prisma/db"
import {
    getPatientDataSchema,
    statusPatientDataSchema,
} from "../../schema/schema"
import { NotFound } from "../_errors/route-error"

// Tipo dos parâmetros baseado no schema
type PatientParams = z.infer<typeof getPatientDataSchema>

// Configuração dos campos a serem selecionados
const PATIENT_SELECT = {
    id: true,
    name: true,
    cpf: true,
    dateOfBirth: true,
    phone: true,
    email: true,
    sex: true,
    profession: true,
    createdAt: true,
    updatedAt: true,
    address: {
        select: {
            cep: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
        },
    },
    adultResponsible: {
        select: {
            name: true,
            cpf: true,
            phone: true,
            email: true,
            address: {
                select: {
                    cep: true,
                    street: true,
                    number: true,
                    complement: true,
                    neighborhood: true,
                    city: true,
                    state: true,
                },
            },
        },
    },
    clinicalData: {
        select: {
            id: true,
            cid: true,
            covenant: true,
            expires: true,
            CNS: true,
            allegation: true,
            diagnosis: true,
        },
    },
    appointments: {
        select: {
            id: true,
            appointmentDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    },
}

/**
 * Busca os detalhes de um paciente pelo ID.
 * @throws {NotFound} Se o paciente não for encontrado.
 */
async function getPatientById(id: string) {
    const patient = await prisma.patients.findUnique({
        where: { id },
        select: PATIENT_SELECT,
    })

    if (!patient) {
        throw new NotFound("Patient not found")
    }

    return patient
}

/**
 * Registra a rota para obter detalhes de um paciente específico.
 */
export async function getPatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/patients/:id",
        {
            schema: {
                tags: ["Patients"],
                summary: "Get details of a specific patient",
                security: [{ bearerAuth: [] }],
                params: getPatientDataSchema,
                response: statusPatientDataSchema,
            },
        },
        async (request: FastifyRequest<{ Params: PatientParams }>, reply) => {
            const { id } = request.params
            const patient = await getPatientById(id)
            return reply.status(200).send({ patient })
        }
    )
}
