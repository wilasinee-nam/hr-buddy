
import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
    try {
        const orgId = 1; // Assuming org 1 based on logs
        const departments = await prisma.department.findMany({
            where: { organizationId: orgId },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        console.log("Departments for Org 1:");
        console.table(departments.map(d => ({
            id: d.id,
            name: d.name,
            userCount: d._count.users
        })));

        // Check for duplicates by name
        const nameCounts: Record<string, number> = {};
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
