import dotenv from "dotenv"
import fastify, {
    type FastifyInstance,
    type FastifyReply,
    type FastifyRequest,
} from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import helmet from "@fastify/helmet"
import csrf from "@fastify/csrf-protection"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { BadRequest } from "../routes/_errors/route-error"

// Rotas
import { loginAuth } from "../routes/login-auth"
import { logOut } from "../routes/logout"
import { verifyAuth } from "../routes/verify-auth"
import { csrfAuth } from "../routes/csrf-auth"
import { addPatient } from "../routes/patient/create-patient"
import { getPatients } from "../routes/patient/get-patients"
import { getPatient } from "../routes/patient/get-patient"
import { updatePatient } from "../routes/patient/update-patient"
import { deletePatient } from "../routes/patient/delete-patient"
import { addClinicalRecord } from "../routes/clinical/create-record"
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
import { errorHandler } from "../routes/_errors/error-handler"

dotenv.config()

// Inicialização do aplicativo Fastify com suporte a Zod
export const app: FastifyInstance = fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>()

// Configuração de serialização e validação com Zod
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

// Decorador para verificar a autenticação via cookie
app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const token = request.cookies.dfauth

            if (!token) {
                throw new BadRequest("Token não fornecido")
            }

            await request.jwtVerify({ onlyCookie: true })
        } catch (error) {
            reply.status(401).send({
                message: "Não Autorizado",
            })
        }
    }
)

/**
 * Configura os plugins do Fastify (Swagger, CORS, CSRF, JWT, Cookie e Helmet).
 */
async function configurePlugins() {
    await app.register(cookie, {
        secret: process.env.SIGN_COOKIE as string,
    })

    await app.register(jwt, {
        secret: process.env.JWT_SECRET as string,
        cookie: {
            cookieName: "dfauth",
            signed: true,
        },
    })

    await app.register(csrf, {
        cookieKey: "csrfToken",
        cookieOpts: {
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        },
        getToken: (request: FastifyRequest) =>
            request.headers["x-csrf-token"]?.toString() || "",
    })

    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
        xFrameOptions: {
            action: "deny",
        },
        xXssProtection: true,
        xDnsPrefetchControl: {
            allow: false,
        },
        referrerPolicy: {
            policy: "no-referrer",
        },
    })

    await app.register(rateLimit, {
        max: 5,
        timeWindow: "10 minutes",
        keyGenerator: request => {
            return request.ip
        },
        errorResponseBuilder: (request, context) => {
            return {
                statusCode: 429,
                error: "Too Many Requests",
                message: `Limite de tentativas excedido. Tente novamente em ${context.after} segundos`,
            }
        },
        allowList: request => !request.url.includes("/auth/login"),
    })

    await app.register(cors, {
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
    })

    await app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Duofisio Clinic API",
                description: "Documentation for Duofisio Clinic API Routes",
                version: "1.0.0",
            },
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "dfauth",
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    })

    await app.register(fastifySwaggerUi, {
        routePrefix: "/api",
    })
}

/**
 * Registra as rotas públicas (não requerem autenticação).
 */
function registerPublicRoutes() {
    app.register(loginAuth, { prefix: "/auth" })
    app.register(logOut, { prefix: "/auth" })
    app.register(verifyAuth, { prefix: "/auth" })
    app.register(csrfAuth, { prefix: "/auth" })
}

/**
 * Registra as rotas protegidas (requerem autenticação JWT via cookie).
 */
function registerProtectedRoutes() {
    app.register(
        async (protectedRoutes: FastifyInstance) => {
            protectedRoutes.addHook("preHandler", app.authenticate)

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
async function start() {
    await configurePlugins()
    registerPublicRoutes()
    registerProtectedRoutes()

    const port = Number(process.env.PORT) || 3000

    await app.listen({ port })
    app.log.info(`Server is running on port ${port}`)
}

// Inicialização do servidor
start().catch(error => {
    app.log.error(error)
    process.exit(1)
})
