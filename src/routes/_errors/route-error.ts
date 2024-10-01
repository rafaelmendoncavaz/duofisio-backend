export class BadRequest extends Error {
    constructor(message: string) {
        super(message ?? "Unauthorized")
    }
}

export class Unauthorized extends Error {}
