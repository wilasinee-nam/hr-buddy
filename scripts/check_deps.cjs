
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const orgId = 1;
        console.log("Checking departments for Org ID:", orgId);

        const departments = await prisma.department.findMany({
            where: { organizationId: orgId },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        console.log(`Found ${departments.length} departments.`);
        console.table(departments.map(d => ({
            id: d.id,
            name: d.name,
            userCount: d._count.users
        })));

        const nameCounts = {};
        departments.forEach(d => {
            nameCounts[d.name] = (nameCounts[d.name] || 0) + 1;
        });

        const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log("\nDuplicate Department Names found:");
            duplicates.forEach(([name, count]) => {
                console.log(`- "${name}": ${count} times`);
            });
        } else {
            console.log("\nNo duplicate department names found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
