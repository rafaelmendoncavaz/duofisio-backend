import { hash } from "bcryptjs";
import { prisma } from "../prisma/db";
import { startOfDay, addDays, set, getDay } from "date-fns";

async function seed() {
    // Limpa todas as tabelas para evitar duplicatas
    await prisma.session.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.clinicalData.deleteMany();
    await prisma.adultResponsible.deleteMany();
    await prisma.patients.deleteMany();
    await prisma.address.deleteMany();
    await prisma.employees.deleteMany();

    // Cria senha padrão para o funcionário
    const rafaPassword = await hash(process.env.RAFAEL_PASSWORD as string, 6);
    const mariaPassword = await hash(process.env.MARIA_PASSWORD as string, 6);
    const dennisPassword = await hash(process.env.DENNIS_PASSWORD as string, 6);
    const lucasPassword = await hash(process.env.LUCAS_PASSWORD as string, 6);
    const joaoPassword = await hash(process.env.JOAO_PASSWORD as string, 6);

    // Criação de Funcionários
    const employee1 = await prisma.employees.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Rafael",
            email: process.env.RAFAEL_EMAIL as string,
            password: rafaPassword,
            isAdmin: true,
        },
    });

    const employee2 = await prisma.employees.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            name: "Dr. Maria",
            email: process.env.MARIA_EMAIL as string,
            password: mariaPassword,
        },
    });

    await prisma.employees.createMany({
        data: [
            {
                id: crypto.randomUUID(),
                name: "Dennis",
                email: process.env.DENNIS_EMAIL as string,
                password: dennisPassword,
                isAdmin: true,
            },
            {
                id: crypto.randomUUID(),
                name: "Lucas",
                email: process.env.LUCAS_EMAIL as string,
                password: lucasPassword,
            },
            {
                id: crypto.randomUUID(),
                name: "João",
                email: process.env.JOAO_EMAIL as string,
                password: joaoPassword,
            },
        ],
    });

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
    });

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
    });

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
    });

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
    });

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
    });

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
            adultResponsibleId: adultResponsible.id,
        },
    });

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
    });

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
    });

    const clinicalData2 = await prisma.clinicalData.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440041",
            cid: "J45",
            allegation: "Falta de ar",
            diagnosis: "Asma",
            patientId: patient2.id,
        },
    });

    const clinicalData3 = await prisma.clinicalData.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440042",
            cid: "F41.9",
            allegation: "Ansiedade",
            diagnosis: "Transtorno de ansiedade",
            patientId: patient3.id,
        },
    });

    // Função auxiliar para gerar datas de sessões com base em daysOfWeek
    function generateSessionDates(
        startDate: Date,
        totalSessions: number,
        daysOfWeek: number[]
    ): Date[] {
        const sessionDates: Date[] = [];
        let currentDate = startDate;
        let sessionsGenerated = 0;

        while (sessionsGenerated < totalSessions) {
            const dayOfWeek = getDay(currentDate);
            if (daysOfWeek.includes(dayOfWeek)) {
                sessionDates.push(new Date(currentDate));
                sessionsGenerated++;
            }
            currentDate = addDays(currentDate, 1);
        }

        return sessionDates;
    }

    // Agendamentos com Sessões
    const baseDate = startOfDay(new Date()); // Hoje em UTC

    // Agendamento 1: João Silva (3 sessões às segundas e quintas)
    const appointment1 = await prisma.appointment.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440050",
            totalSessions: 3,
            patientId: patient1.id,
            employeeId: employee1.id,
            clinicalRecordId: clinicalData1.id,
        },
    });

    const sessionDates1 = generateSessionDates(
        set(baseDate, { hours: 9, minutes: 0 }),
        3,
        [1, 4] // Segunda e Quinta
    );

    await prisma.session.createMany({
        data: sessionDates1.map((date, index) => ({
            id: `550e8400-e29b-41d4-a716-44665544005${index + 1}`,
            appointmentId: appointment1.id,
            appointmentDate: date,
            duration: 60,
            sessionNumber: index + 1,
            status: index === 0 ? "FINALIZADO" : "SOLICITADO",
            progress: index === 0 ? "Paciente relatou melhora na dor" : null,
        })),
    });

    // Agendamento 2: Ana Costa (2 sessões às terças)
    const appointment2 = await prisma.appointment.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440051",
            totalSessions: 2,
            patientId: patient2.id,
            employeeId: employee2.id,
            clinicalRecordId: clinicalData2.id,
        },
    });

    const sessionDates2 = generateSessionDates(
        set(addDays(baseDate, 1), { hours: 10, minutes: 30 }),
        2,
        [2] // Terça
    );

    await prisma.session.createMany({
        data: sessionDates2.map((date, index) => ({
            id: `550e8400-e29b-41d4-a716-44665544006${index + 1}`,
            appointmentId: appointment2.id,
            appointmentDate: date,
            duration: 30,
            sessionNumber: index + 1,
            status: "SOLICITADO",
            progress: null,
        })),
    });

    // Agendamento 3: Pedro Almeida (4 sessões às quartas e sextas)
    const appointment3 = await prisma.appointment.create({
        data: {
            id: "550e8400-e29b-41d4-a716-446655440052",
            totalSessions: 4,
            patientId: patient3.id,
            employeeId: employee1.id,
            clinicalRecordId: clinicalData3.id,
        },
    });

    const sessionDates3 = generateSessionDates(
        set(addDays(baseDate, 2), { hours: 14, minutes: 0 }),
        4,
        [3, 5] // Quarta e Sexta
    );

    await prisma.session.createMany({
        data: sessionDates3.map((date, index) => ({
            id: `550e8400-e29b-41d4-a716-44665544007${index + 1}`,
            appointmentId: appointment3.id,
            appointmentDate: date,
            duration: 90,
            sessionNumber: index + 1,
            status: index === 0 ? "CONFIRMADO" : "SOLICITADO",
            progress: null,
        })),
    });

    console.log("Seed concluído com sucesso!");
}

seed()
    .catch((e) => {
        console.error("Erro ao executar o seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
