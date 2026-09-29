import { PrismaClient } from "@prisma/client";
import { POSITIONS, normalizePosition } from "../src/lib/positions";

const db = new PrismaClient();

async function main() {
  const rows = await db.official.findMany();
  for (const r of rows) {
    const next = normalizePosition(r.role);
    if (next !== r.role) {
      await db.official.update({ where: { id: r.id }, data: { role: next } });
      console.log(`"${r.role}" -> "${next}"  (${r.name})`);
    } else {
      console.log(`sama  "${r.role}"  (${r.name})`);
    }
  }

  console.log("\nDaftar jabatan kanonik:");
  for (const p of POSITIONS) {
    console.log(`  tingkat ${p.level}  rank ${String(p.rank).padStart(2)}  ${p.value}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
