import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../prisma/db";
import { NotFound } from "../_errors/route-error";
import { statusGetSinglePatientAppointments } from "../../schema/appointment";

/**
 * Busca os detalhes de uma sessão específica.
 * @throws {NotFound} Se a sessão não for encontrada.
 */
async function getSessionById(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            appointmentDate: true,
            duration: true,
            status: true,
            sessionNumber: true,
            progress: true,
            appointment: {
                select: {
                    id: true,
                    totalSessions: true,
                    createdAt: true,
                    updatedAt: true,
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                    employee: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    clinicalRecord: {
                        select: {
                            id: true,
                            cid: true,
                            allegation: true,
                            diagnosis: true,
                        },
                    },
                },
            },
        },
    });

    if (!session) {
        throw new NotFound("Sessão não encontrada");
    }

    return {
        id: session.id,
        appointmentDate: session.appointmentDate,
        duration: session.duration,
        status: session.status,
        sessionNumber: session.sessionNumber,
        progress: session.progress,
        appointment: {
            id: session.appointment.id,
            totalSessions: session.appointment.totalSessions,
            createdAt: session.appointment.createdAt,
            updatedAt: session.appointment.updatedAt,
            patient: {
                patientId: session.appointment.patient.id,
                name: session.appointment.patient.name,
                phone: session.appointment.patient.phone,
                email: session.appointment.patient.email,
            },
            employee: {
                employeeId: session.appointment.employee.id,
                employeeName: session.appointment.employee.name,
            },
            appointmentReason: {
                id: session.appointment.clinicalRecord.id,
                cid: session.appointment.clinicalRecord.cid,
                allegation: session.appointment.clinicalRecord.allegation,
                diagnosis: session.appointment.clinicalRecord.diagnosis,
            },
        },
    };
}

/**
 * Registra a rota para obter os detalhes de uma sessão específica.
 */
export async function getAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/appointments/:id",
        {
            preHandler: [app.authenticate],
            schema: {
                tags: ["Appointments"],
                summary: "Get details of a specific session",
                security: [{ cookieAuth: [] }],
                params: z.object({
                    id: z.string().uuid("ID da sessão deve ser um UUID"),
                }),
                response: statusGetSinglePatientAppointments,
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
            const { id } = request.params;

            const session = await getSessionById(id);

            return reply.status(200).send({ session });
        }
    );
}
