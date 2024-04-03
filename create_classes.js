import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

const classes = [
  '7A',
  '7B',
  '7C',
  '8A',
  '8B',
  '8C',
  '9A',
  '9B',
  '9C',
]

async function main() {
  const allSchools = await prisma.school.findMany();
  for (const school of allSchools) {
    for (const className of classes) {
      await prisma.group.create({
        data: {
          name: className,
          school_id: school.id,
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
