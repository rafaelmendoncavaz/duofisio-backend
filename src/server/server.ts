import dotenv from "dotenv"
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
import { auth } from "../middlewares/auth"
import { loginAuth } from "../routes/login-auth"

dotenv.config()

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

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
    routePrefix: "/docs",
})

app.register(fastifyJwt, {
    secret: `${process.env.JWT_SECRET}`,
})

app.register(fastifyCors)

app.register(auth)

app.register(loginAuth)

app.listen({
    port: Number(process.env.PORT),
}).then(() => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
