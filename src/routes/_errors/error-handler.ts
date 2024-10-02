import { ZodError } from "zod"
import type { FastifyErrorHandler } from "../../types/types"
import { BadRequest, NotFound, Unauthorized } from "./route-error"

export const errorHandler: FastifyErrorHandler = (error, request, response) => {
    if (error instanceof ZodError) {
        return response.status(400).send({
            message: "Validation Error",
            errors: error.flatten().fieldErrors,
        })
    }

    if (error instanceof BadRequest) {
        return response.status(400).send({
            message: error.message,
        })
    }

    if (error instanceof Unauthorized) {
        return response.status(401).send({
            message: error.message,
        })
    }

    if (error instanceof NotFound) {
        return response.status(404).send({
            message: error.message,
        })
    }

    console.error(error)

    return response.status(500).send({
        message: "Internal Server Error",
    })
}
