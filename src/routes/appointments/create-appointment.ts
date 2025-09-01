import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { z } from "zod";
import { isBefore, isSameDay, addDays, getDay, parseISO, isValid } from "date-fns";
import { prisma } from "../../../prisma/db";
import { BadRequest } from "../_errors/route-error";
import {
    createAppointmentSchema,
    statusCreateAppointmentSchema,
} from "../../schema/appointment";

/**
 * Gera datas para as sessões baseadas nos dias da semana e quantidade total.
 */
function generateSessionDates(
    startDate: Date, // Data inicial em UTC (instante).
    totalSessions: number,
    daysOfWeek?: number[] // Opcional
): Date[] {
    const sessionDates: Date[] = [new Date(startDate)]; // Primeira sessão é sempre a startDate

    if (totalSessions === 1 || !daysOfWeek || daysOfWeek.length === 0) {
        // Se for apenas uma sessão ou daysOfWeek não for fornecido, retorna só a startDate
        return sessionDates;
    }

    let currentDate = addDays(startDate, 1); // Começa após a startDate
    let sessionsGenerated = 1; // Já temos a primeira sessão

    while (sessionsGenerated < totalSessions) {
        const dayOfWeek = getDay(currentDate); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        if (daysOfWeek.includes(dayOfWeek)) {
            if (
                !isBefore(currentDate, new Date()) ||
                isSameDay(currentDate, new Date())
            ) {
                sessionDates.push(new Date(currentDate));
                sessionsGenerated++;
            }
        }
        currentDate = addDays(currentDate, 1); // Avança um dia
    }

    return sessionDates;
}

/**
 * Cria um novo agendamento com sessões associadas.
 * Todas as datas são salvas em UTC, sem conversão de fuso horário.
 */
async function createAppointmentLogic(
    patientId: string,
    employeeId: string,
    clinicalRecordId: string,
    appointmentDate: Date, // Data inicial em UTC (Date object)
    duration: number,
    totalSessions: number,
    daysOfWeek?: number[] // Opcional
) {
    // Ajustar "now" para UTC
    const now = new Date();

    // Validação de data futura ou atual
    if (isBefore(appointmentDate, now) && !isSameDay(appointmentDate, now)) {
        throw new BadRequest(
            "A data do agendamento deve ser hoje ou no futuro"
        );
    }

    // Criar o agendamento principal (Appointment)
    const appointment = await prisma.appointment.create({
        data: {
            patientId,
            employeeId,
            clinicalRecordId,
            totalSessions, // Armazena o número total de sessões planejadas
        },
    });

    // Gera as datas das sessões
    const sessionDates = generateSessionDates(
        appointmentDate,
        totalSessions,
        daysOfWeek
    );

    // Criar as sessões associadas
    const sessions = await Promise.all(
        sessionDates.map((date, index) => {
            return prisma.session.create({
                data: {
                    appointmentId: appointment.id,
                    appointmentDate: date, 
                    duration,
                    sessionNumber: index + 1, // Começa em 1
                    status: "SOLICITADO",
                    progress: null, // Campo opcional, começa vazio
                },
            });
        })
    );
    
    return {
        appointmentId: appointment.id,
        sessions
    };
}

/**
 * Registra a rota para criar um novo agendamento com sessões.
 */
export async function createAppointment(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        "/appointments",
        {
            preHandler: [app.csrfProtection, app.authenticate],
            schema: {
                tags: ["Appointments"],
                summary: "Create a new appointment with sessions for a patient",
                security: [{ cookieAuth: [] }],
                body: createAppointmentSchema,
                response: statusCreateAppointmentSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof createAppointmentSchema>;
            }>,
            reply
        ) => {
            const {
                patientId,
                employeeId,
                appointmentDate,
                duration,
                totalSessions,
                daysOfWeek, // Opcional
                clinicalRecordId,
            } = request.body;

            const parsedAppointmentDate = parseISO(appointmentDate);
            if (!isValid(parsedAppointmentDate)) {
                throw new BadRequest("appointmentDate inválido. Envie uma string ISO válida.");
            }

            const result = await createAppointmentLogic(
                patientId,
                employeeId,
                clinicalRecordId,
                parsedAppointmentDate,
                duration,
                totalSessions,
                daysOfWeek // Pode ser undefined
            );

            return reply.status(201).send({
                appointmentId: result.appointmentId,
            });
        }
    );
}
