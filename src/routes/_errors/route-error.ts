// Classe base para erros personalizados da API
abstract class RouteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name; // Define o nome da classe automaticamente
        Object.setPrototypeOf(this, new.target.prototype); // Garante herança correta
    }
}

/**
 * Representa um erro de requisição inválida (400 Bad Request).
 */
export class BadRequest extends RouteError {
    constructor(message = "Bad Request") {
        super(message);
    }
}

/**
 * Representa um erro de autenticação ou permissão (401 Unauthorized).
 */
export class Unauthorized extends RouteError {
    constructor(message = "Unauthorized") {
        super(message);
    }
}

/**
 * Representa um erro de recurso não encontrado (404 Not Found).
 */
export class NotFound extends RouteError {
    constructor(message = "Not Found") {
        super(message);
    }
}
