import { hash } from "bcrypt"
import { prisma } from "../prisma/db"

async function seed() {
    await prisma.employees.deleteMany()

    const password = await hash("123456", 6)
    
    await prisma.employees.create({
        data: {
            name: "Rafael",
            email: "rafael@acme.com",
            password,
        }
    })
}

seed()