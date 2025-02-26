import "dotenv/config"
import fastifyCors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt"
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
import { addClinicalRecord } from "../routes/clinical/add-record"
import { getClinicalRecords } from "../routes/clinical/get-records"
import { getSingleClinicalRecord } from "../routes/clinical/get-record"
import { deleteClinicalRecord } from "../routes/clinical/delete-record"
import { auth } from "../middlewares/auth"

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
    secret: process.env.JWT_SECRET as string,
})

// Employee Routes
app.register(loginAuth, {
    prefix: "/auth",
})
app.register(verifyAuth, {
    prefix: "/auth",
})

// Protected Routes
app.register(
    async protectedRoutes => {
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
        protectedRoutes.register(getAppointments)
        protectedRoutes.register(getAppointment)
        protectedRoutes.register(updateAppointment)
        protectedRoutes.register(deleteAppointment)
    },
    {
        prefix: "/dashboard",
    }
)

app.listen({
    port: Number(process.env.PORT || 3000),
}).then(() => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
