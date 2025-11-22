
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            doctorProfile: true,
            patientProfile: true,
        },
        take: 10,
    });

    console.log('--- CREDENCIALES DE PRUEBA ---');
    users.forEach(user => {
        console.log(`Role: ${user.role}`);
        console.log(`Email: ${user.email}`);
        // Note: We can't see passwords as they are hashed, but usually seeds use 'password123' or similar
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
