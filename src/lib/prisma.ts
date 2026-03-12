import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
  const connectionString = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL!

  // Usa adaptador Turso solo si la URL es de Turso (empieza con libsql:// o wss://)
  if (connectionString?.startsWith('libsql') || connectionString?.startsWith('wss')) {
    const authToken = process.env.TURSO_AUTH_TOKEN
    const libsql = createClient({
      url: connectionString,
      authToken,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Fallback a Prisma normal (local SQLitedev.db)
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
