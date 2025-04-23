import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { z } from "zod";
import { getPatientDataSchema } from "../../schema/schema";
import { prisma } from "../../../prisma/db";
import { NotFound } from "../_errors/route-error";

// Tipo dos parâmetros baseado no schema
type PatientParams = z.infer<typeof getPatientDataSchema>;

/**
 * Verifica se o paciente existe e retorna seus dados.
 * @throws {NotFound} Se o paciente não for encontrado.
 */
async function getPatientOrThrow(id: string) {
    const patient = await prisma.patients.findUnique({
        where: { id },
    });

    if (!patient) {
        throw new NotFound("Patient not found");
    }

    return patient;
}

/**
 * Deleta o endereço associado a um paciente ou responsável.
 */
async function deleteAddress(addressId: string) {
    await prisma.address.delete({
        where: { id: addressId },
    });
}

/**
 * Deleta o responsável adulto e seu endereço, se não houver outros pacientes associados.
 */
async function deleteAdultResponsibleIfUnused(adultResponsibleId: string) {
    const adult = await prisma.adultResponsible.findUnique({
        where: { id: adultResponsibleId },
        include: { patient: true },
    });

    if (adult && adult.patient.length === 0) {
        await prisma.adultResponsible.delete({
            where: { id: adult.id },
        });
        await deleteAddress(adult.addressId);
    }
}

/**
 * Registra a rota para deletar um paciente e seus dados associados.
 */
export async function deletePatient(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().delete(
        "/patients/:id",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Patients"],
                summary: "Delete patient data",
                security: [{ cookieAuth: [] }],
                params: getPatientDataSchema,
            },
        },
        async (request: FastifyRequest<{ Params: PatientParams }>, reply) => {
            const { id } = request.params;

            const patient = await getPatientOrThrow(id);

            await prisma.patients.delete({ where: { id } });
            await deleteAddress(patient.addressId);

            if (patient.adultResponsibleId) {
                await deleteAdultResponsibleIfUnused(
                    patient.adultResponsibleId
                );
            }

            return reply.status(204).send();
        }
    );
}
