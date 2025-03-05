import "dotenv/config"
import fastify, { type FastifyInstance } from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod"

// Rotas
import { loginAuth } from "../routes/login-auth"
import { verifyAuth } from "../routes/verify-auth"
import { addPatient } from "../routes/patient/add-patient"
import { getPatients } from "../routes/patient/get-patients"
import { getPatient } from "../routes/patient/get-patient"
import { updatePatient } from "../routes/patient/update-patient"
import { deletePatient } from "../routes/patient/delete-patient"
import { addClinicalRecord } from "../routes/clinical/add-record"
import { getClinicalRecords } from "../routes/clinical/get-records"
import { getSingleClinicalRecord } from "../routes/clinical/get-record"
import { deleteClinicalRecord } from "../routes/clinical/delete-record"
import { createAppointment } from "../routes/appointments/create-appointment"
import { repeatAppointment } from "../routes/appointments/repeat-appointment"
import { getAppointments } from "../routes/appointments/get-appointments"
import { getAppointment } from "../routes/appointments/get-appointment"
import { updateAppointment } from "../routes/appointments/update-appointment"
import { deleteAppointment } from "../routes/appointments/delete-appointment"

// Middlewares e Handlers
import { auth } from "../middlewares/auth"
import { errorHandler } from "../routes/_errors/error-handler"

// Inicialização do aplicativo Fastify com suporte a Zod
export const app = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>()

// Configuração de serialização e validação com Zod
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

/**
 * Configura os plugins do Fastify (Swagger, CORS, JWT).
 */
function configurePlugins() {
    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Duofisio Clinic API",
                description: "Documentation for Duofisio Clinic API Routes",
                version: "1.0.0",
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    })

    app.register(fastifySwaggerUi, {
        routePrefix: "/api",
    })

    app.register(fastifyCors, {
        credentials: true,
        origin: true,
    })

    app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET as string,
    })
}

/**
 * Registra as rotas públicas (não requerem autenticação).
 */
function registerPublicRoutes() {
    app.register(loginAuth, { prefix: "/auth" })
    app.register(verifyAuth, { prefix: "/auth" })
}

/**
 * Registra as rotas protegidas (requerem autenticação JWT).
 */
function registerProtectedRoutes() {
    app.register(
        async (protectedRoutes: FastifyInstance) => {
            protectedRoutes.addHook("preHandler", auth)

            // Patient Routes
            protectedRoutes.register(addPatient)
            protectedRoutes.register(getPatients)
            protectedRoutes.register(getPatient)
            protectedRoutes.register(updatePatient)
            protectedRoutes.register(deletePatient)

            // Clinical Record Routes
            protectedRoutes.register(addClinicalRecord)
            protectedRoutes.register(getClinicalRecords)
            protectedRoutes.register(getSingleClinicalRecord)
            protectedRoutes.register(deleteClinicalRecord)

            // Appointment Routes
            protectedRoutes.register(createAppointment)
            protectedRoutes.register(repeatAppointment)
            protectedRoutes.register(getAppointments)
            protectedRoutes.register(getAppointment)
            protectedRoutes.register(updateAppointment)
            protectedRoutes.register(deleteAppointment)
        },
        { prefix: "/dashboard" }
    )
}

/**
 * Inicia o servidor na porta especificada.
 */
async function startServer() {
    const port = Number(process.env.PORT) || 3000

    try {
        await app.listen({ port })
        app.log.info(`Server is running on port ${port}`)
    } catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

// Inicialização do servidor
configurePlugins()
registerPublicRoutes()
registerProtectedRoutes()
startServer()
