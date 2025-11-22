
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 20,
        });

        console.log('--- CREDENCIALES ENCONTRADAS ---');
        users.forEach(user => {
            console.log(`Role: ${user.role}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.name}`);
            console.log('Password: password123 (Por defecto en seeds)');
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
