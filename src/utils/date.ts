import { isValid, parseISO } from "date-fns";

/**
 * Formata um valor de data (Date | string) para ISO string.
 * Lance erro se não for possível interpretar.
 */
export function formatToISOString(value: unknown): string {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string") {
        const parsed = parseISO(value);
        if (isValid(parsed)) return parsed.toISOString();
        throw new Error(`Invalid date string encountered: "${value}"`);
    }
    throw new Error(`Unsupported date value encountered: ${String(value)}`);
}

/**
 * Retorna o dia em formato UTC
 */
export function getUTCDay(date: Date): number {
    return date.getUTCDay();
}

/**
 * Realiza a comparação de datas em formato UTC
 * @param d1 Primeira data a ser comparada
 * @param d2 Segunda data a ser comparada
 * @returns Retorna true ou false
 */
export function isSameUTCDay(d1: Date, d2: Date): boolean {
    return (
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate()
    );
}
