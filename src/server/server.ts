import dotenv from "dotenv"
import fastifyCors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt"
import cookie, { type FastifyCookieOptions } from "@fastify/cookie"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import fastify from "fastify"
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { loginAuth } from "../routes/login-auth"
import { errorHandler } from "../routes/_errors/error-handler"
import { addPatient } from "../routes/patient/add-patient"
import { getPatients } from "../routes/patient/get-patients"
import { getPatient } from "../routes/patient/get-patient"
import { updatePatient } from "../routes/patient/update-patient"
import { deletePatient } from "../routes/patient/delete-patient"
import { createAppointment } from "../routes/appointments/create-appointment"
import { getAppointments } from "../routes/appointments/get-appointments"
import { getAppointment } from "../routes/appointments/get-appointment"
import { updateAppointment } from "../routes/appointments/update-appointment"
import { deleteAppointment } from "../routes/appointments/delete-appointment"
import { verifyAuth } from "../routes/verify-auth"

dotenv.config()

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

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
    secret: `${process.env.JWT_SECRET}`,
    cookie: {
        cookieName: "authToken",
        signed: true,
    },
})
app.register(cookie, {
    secret: `${process.env.JWT_SECRET}`,
    hook: "preHandler",
    parseOptions: {
        signed: true,
    },
} as FastifyCookieOptions)

// Employee Routes
app.register(loginAuth)
app.register(verifyAuth)

// Patient Routes
app.register(addPatient)
app.register(getPatients)
app.register(getPatient)
app.register(updatePatient)
app.register(deletePatient)

// Appointment Routes
app.register(createAppointment)
app.register(getAppointments)
app.register(getAppointment)
app.register(updateAppointment)
app.register(deleteAppointment)

app.listen({
    port: Number(process.env.PORT),
}).then(() => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
