import { z } from "zod"

/**
 * Schema para dados de endereço.
 */
export const addressSchema = z.object({
    cep: z.string().length(8, "O CEP deve ter 8 dígitos"),
    street: z.string().min(3, "Insira o nome da rua"),
    number: z.coerce.number().min(1, "Insira o número da residência"),
    complement: z.string().nullable(),
    neighborhood: z.string().min(1, "Insira o nome do bairro"),
    city: z.string().min(1, "Insira a cidade"),
    state: z.string().min(2, "Insira o estado"),
})

/**
 * Schema para dados clínicos.
 */
export const clinicalDataSchema = z.object({
    id: z.string().uuid(),
    cid: z.string().min(1, "Insira o código do CID"),
    covenant: z.string().nullable(),
    expires: z.coerce.date().nullable(),
    CNS: z.string().nullable(),
    allegation: z.string().min(1, "Insira a queixa do paciente"),
    diagnosis: z.string().min(1, "Insira o diagnóstico"),
})

/**
 * Schema para responsável adulto.
 */
export const adultResponsibleSchema = z
    .object({
        name: z.string().min(3, "Insira o nome do responsável"),
        cpf: z.string().length(11, "O CPF deve ter 11 dígitos"),
        phone: z.string().min(9, "Insira um número de telefone válido"),
        email: z.string().email("Insira um e-mail válido"),
        address: addressSchema,
    })
    .optional()
    .nullable()
