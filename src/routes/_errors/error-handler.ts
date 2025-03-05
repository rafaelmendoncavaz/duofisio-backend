import type { ZodError } from "zod"
import type { FastifyRequest, FastifyReply } from "fastify"
import type { FastifyErrorHandler } from "../../types/types"
import type { BadRequest, NotFound, Unauthorized } from "./route-error"

type KnownError = Error | ZodError | BadRequest | Unauthorized | NotFound

type ErrorConfig<T extends KnownError = KnownError> = {
    status: number
    message: string | ((error: T) => string)
    extra?: (error: T) => Record<string, unknown>
}

const ERROR_MAP = {
    ZodError: {
        status: 400,
        message: "Validation Error",
        extra: (error: ZodError) => ({ errors: error.flatten().fieldErrors }),
    } as ErrorConfig<ZodError>,
    BadRequest: {
        status: 400,
        message: (error: BadRequest) => error.message,
    } as ErrorConfig<BadRequest>,
    Unauthorized: {
        status: 401,
        message: (error: Unauthorized) => error.message,
    } as ErrorConfig<Unauthorized>,
    NotFound: {
        status: 404,
        message: (error: NotFound) => error.message,
    } as ErrorConfig<NotFound>,
}

const sendErrorResponse = (
    reply: FastifyReply,
    status: number,
    message: string,
    extra?: Record<string, unknown>
) => {
    return reply.status(status).send({
        message,
        ...(extra || {}),
    })
}

// Função auxiliar para chamar a config com o tipo correto
const handleKnownError = <T extends KnownError>(
    reply: FastifyReply,
    error: T,
    config: ErrorConfig<T>
) => {
    const message =
        typeof config.message === "function"
            ? config.message(error)
            : config.message
    const extra = config.extra ? config.extra(error) : undefined
    return sendErrorResponse(reply, config.status, message, extra)
}

export const errorHandler: FastifyErrorHandler = (
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const errorName =
        error instanceof Error ? error.constructor.name : "Unknown"
    const errorConfig = ERROR_MAP[errorName as keyof typeof ERROR_MAP]

    if (errorConfig) {
        return handleKnownError(reply, error as any, errorConfig)
    }

    console.error("Unhandled error:", error)
    return sendErrorResponse(reply, 500, "Internal Server Error")
}
