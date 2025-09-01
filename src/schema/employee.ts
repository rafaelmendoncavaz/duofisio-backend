import z from "zod";

export const createEmployeeSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    isAdmin: z.boolean(),
});

export const updateEmployeeSchema = z.object({
    email: z.string().optional(),
    password: z.string().optional(),
    isAdmin: z.boolean().optional(),
})

export const getEmployeesSchema = {
    200: z.object({
        employees: z.array(
            z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string().email(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                isAdmin: z.boolean(),
            })
        )
    })
}

export const getSingleEmployeeSchema = {
    200: z.object({
        id: z.string().uuid(),
        name: z.string(),
    })
}