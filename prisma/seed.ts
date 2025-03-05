import { hash } from "bcrypt"
import { prisma } from "../prisma/db"
import { startOfDay, addDays, set } from "date-fns"

async function seed() {
    // Limpa todas as tabelas para evitar duplicatas
    await prisma.appointment.deleteMany()
    await prisma.clinicalData.deleteMany()
    await prisma.adultResponsible.deleteMany()
    await prisma.patients.deleteMany()
    await prisma.address.deleteMany()
    await prisma.employees.deleteMany()

    // Cria senha padrão para o funcionário
    const password = await hash("123456", 6)

    // Criação de Funcionários
    const employee1 = await prisma.employees.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Rafael",
            email: "rafael@acme.com",
            password,
        },
    })

    const employee2 = await prisma.employees.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Dr. Maria",
            email: "maria@acme.com",
            password,
        },
    })

    // Endereços para pacientes e responsáveis
    const address1 = await prisma.address.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440010",
            cep: "12345678",
            street: "Rua A",
            number: 100,
            complement: "Apto 101",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
        },
    })

    const address2 = await prisma.address.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440011",
            cep: "87654321",
            street: "Rua B",
            number: 200,
            neighborhood: "Jardins",
            city: "São Paulo",
            state: "SP",
        },
    })

    const address3 = await prisma.address.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440012",
            cep: "54321876",
            street: "Rua C",
            number: 300,
            neighborhood: "Vila Mariana",
            city: "São Paulo",
            state: "SP",
        },
    })

    // Responsável Adulto (criado antes do paciente dependente)
    const adultResponsible = await prisma.adultResponsible.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440030",
            name: "Maria Costa",
            cpf: "11122233344",
            phone: "11955556666",
            email: "maria.costa@exemplo.com",
            addressId: address2.id,
        },
    })

    // Pacientes
    const patient1 = await prisma.patients.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440020",
            name: "João Silva",
            cpf: "12345678901",
            dateOfBirth: new Date("1990-05-15"),
            phone: "11987654321",
            email: "joao@exemplo.com",
            sex: "Masculino",
            profession: "Engenheiro",
            addressId: address1.id,
        },
    })

    const patient2 = await prisma.patients.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440021",
            name: "Ana Costa",
            cpf: "98765432109",
            dateOfBirth: new Date("2005-08-20"),
            phone: "11912345678",
            email: "ana@exemplo.com",
            sex: "Feminino",
            addressId: address2.id,
            adultResponsibleId: adultResponsible.id, // Agora criado após o responsável
        },
    })

    const patient3 = await prisma.patients.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440022",
            name: "Pedro Almeida",
            cpf: "45678912345",
            dateOfBirth: new Date("1985-03-10"),
            phone: "11956789012",
            email: "pedro@exemplo.com",
            sex: "Masculino",
            profession: "Professor",
            addressId: address3.id,
        },
    })

    // Casos Clínicos
    const clinicalData1 = await prisma.clinicalData.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440040",
            cid: "M54.9",
            covenant: "Plano XYZ",
            expires: addDays(new Date(), 30),
            CNS: "123456789012345",
            allegation: "Dor nas costas",
            diagnosis: "Lombalgia",
            patientId: patient1.id,
        },
    })

    const clinicalData2 = await prisma.clinicalData.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440041",
            cid: "J45",
            allegation: "Falta de ar",
            diagnosis: "Asma",
            patientId: patient2.id,
        },
    })

    const clinicalData3 = await prisma.clinicalData.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440042",
            cid: "F41.9",
            allegation: "Ansiedade",
            diagnosis: "Transtorno de ansiedade",
            patientId: patient3.id,
        },
    })

    // Agendamentos
    const baseDate = startOfDay(new Date())
    await prisma.appointment.createMany({
        data: [
            {
                id: "550e8400-e29b-41d4-a716-446655440050",
                appointmentDate: set(baseDate, { hours: 9, minutes: 0 }),
                duration: 60,
                status: "FINALIZADO",
                patientId: patient1.id,
                employeeId: employee1.id,
                clinicalRecordId: clinicalData1.id,
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440051",
                appointmentDate: set(addDays(baseDate, 1), {
                    hours: 10,
                    minutes: 30,
                }),
                duration: 30,
                status: "SOLICITADO",
                patientId: patient2.id,
                employeeId: employee2.id,
                clinicalRecordId: clinicalData2.id,
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440052",
                appointmentDate: set(addDays(baseDate, 2), {
                    hours: 14,
                    minutes: 0,
                }),
                duration: 90,
                status: "CONFIRMADO",
                patientId: patient3.id,
                employeeId: employee1.id,
                clinicalRecordId: clinicalData3.id,
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440053",
                appointmentDate: set(addDays(baseDate, 2), {
                    hours: 14,
                    minutes: 0,
                }),
                duration: 60,
                status: "SOLICITADO",
                patientId: patient1.id,
                employeeId: employee2.id,
                clinicalRecordId: clinicalData1.id,
            },
        ],
    })

    console.log("Seed concluído com sucesso!")
}

seed()
    .catch(e => {
        console.error("Erro ao executar o seed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
