import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { z } from "zod";
import { prisma } from "../../../prisma/db";
import { statusGetAppointmentsSchema } from "../../schema/appointment";

/**
 * Busca todos os agendamentos com suas sessões, sem filtros de data.
 */
async function getAppointmentsLogic() {
    const appointments = await prisma.appointment.findMany({
        orderBy: { createdAt: "asc" },
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
            sessions: {
                orderBy: { sessionNumber: "asc" },
                select: {
                    id: true,
                    appointmentDate: true,
                    duration: true,
                    status: true,
                    sessionNumber: true,
                    progress: true,
                },
            },
        },
    });

    return appointments.map((appointment) => ({
        id: appointment.id,
        totalSessions: appointment.totalSessions,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        patient: {
            id: appointment.patient.id,
            name: appointment.patient.name,
            phone: appointment.patient.phone,
        },
        employee: {
            name: appointment.employee.name,
            id: appointment.employee.id,
        },
        appointmentReason: {
            id: appointment.clinicalRecord.id,
            cid: appointment.clinicalRecord.cid,
            allegation: appointment.clinicalRecord.allegation,
            diagnosis: appointment.clinicalRecord.diagnosis,
        },
        sessions: appointment.sessions.map((session) => ({
            id: session.id,
            appointmentDate: session.appointmentDate,
            duration: session.duration,
            status: session.status,
            sessionNumber: session.sessionNumber,
            progress: session.progress,
        })),
    }));
}

/**
 * Registra a rota para obter a lista de agendamentos com suas sessões.
 */
export async function getAppointments(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        "/appointments",
        {
            schema: {
                tags: ["Appointments"],
                summary: "Get a list of appointments with their sessions",
                security: [{ cookieAuth: [] }],
                response: statusGetAppointmentsSchema,
            },
        },
        async (request, reply) => {
            const appointments = await getAppointmentsLogic();
            return reply.status(200).send({ appointments });
        }
    );
}
