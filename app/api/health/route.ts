import { prisma } from "@/lib/db";

/** Liveness probe for Docker – also verifies the database is reachable. */
export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "OK", timestamp });
  } catch {
    return Response.json({ status: "ERROR", timestamp }, { status: 503 });
  }
}
