// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // Limpiar BD (por si acaso, aunque ya estaba limpia)
  await prisma.transaction.deleteMany()
  await prisma.movimientoStock.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.bienDeUso.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.areaNegocio.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()
  await prisma.businessMember.deleteMany()
  await prisma.business.deleteMany()
  await prisma.user.deleteMany()

  // 1. Crear Usuario Demo
  const hashedPassword = await bcrypt.hash('Demo1234', 10)
  const user = await prisma.user.create({
    data: {
      email: 'demo@finarg.com',
      name: 'Usuario Demo',
      password: hashedPassword,
    }
  })
  console.log(`👤 Created user: ${user.email}`)

  // 2. Crear Negocio
  const business = await prisma.business.create({
    data: {
      name: 'FinArg Demo S.A.',
      currency: 'ARS',
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN' // Asumiendo que el rol es string
        }
      }
    }
  })
  console.log(`🏢 Created business: ${business.name}`)

  // 3. Crear Cuentas
  const accountCaja = await prisma.account.create({
    data: {
      name: 'Caja Chica',
      type: 'CASH',
      currency: 'ARS',
      currentBalance: 150000,
      businessId: business.id
    }
  })
  const accountBanco = await prisma.account.create({
    data: {
      name: 'Banco Galicia',
      type: 'BANK',
      currency: 'ARS',
      currentBalance: 5000000,
      businessId: business.id
    }
  })
  const accountUSD = await prisma.account.create({
    data: {
      name: 'Caja Ahorro USD',
      type: 'BANK',
      currency: 'USD',
      currentBalance: 2500,
      businessId: business.id
    }
  })
  console.log(`💰 Created accounts`)

  // 4. Crear Categorías
  const cats = [
    { name: 'Ventas Servicios', type: 'INCOME' },
    { name: 'Alquileres Cobrados', type: 'INCOME' },
    { name: 'Sueldos', type: 'EXPENSE' },
    { name: 'Alquiler Oficina', type: 'EXPENSE' },
    { name: 'Servicios (Luz/Gas)', type: 'EXPENSE' },
    { name: 'Publicidad', type: 'EXPENSE' },
    { name: 'Retiros Socios', type: 'EXPENSE' }
  ]
  const categories: Record<string, string> = {} // Map name -> id

  for (const c of cats) {
    const created = await prisma.category.create({
      data: { ...c, businessId: business.id }
    })
    categories[c.name] = created.id
  }
  console.log(`🏷️ Created categories`)

  // 5. Crear Areas
  const areaVentas = await prisma.areaNegocio.create({
    data: { nombre: 'Comercial', businessId: business.id }
  })
  const areaAdmin = await prisma.areaNegocio.create({
    data: { nombre: 'Administración', businessId: business.id }
  })

  // 6. Contactos
  const clienteA = await prisma.contact.create({
    data: { name: 'Cliente Importante S.A.', type: 'CLIENT', businessId: business.id }
  })
  const provB = await prisma.contact.create({
    data: { name: 'Servicios Tech SRL', type: 'SUPPLIER', businessId: business.id }
  })

  // 7. Transacciones de Ejemplo
  // Income
  await prisma.transaction.create({
    data: {
      date: new Date('2026-03-01'),
      description: 'Cobro Factura Marzo',
      amount: 1500000,
      currency: 'ARS',
      type: 'INCOME',
      accountId: accountBanco.id,
      categoryId: categories['Ventas Servicios'],
      businessId: business.id,
      contactId: clienteA.id,
      areaNegocioId: areaVentas.id,
      estado: 'COBRADO'
    }
  })
  
  // Expense
  await prisma.transaction.create({
    data: {
      date: new Date('2026-03-05'),
      description: 'Pago Alquiler Oficina',
      amount: 450000,
      currency: 'ARS',
      type: 'EXPENSE',
      accountId: accountBanco.id,
      categoryId: categories['Alquiler Oficina'],
      businessId: business.id,
      areaNegocioId: areaAdmin.id,
      estado: 'PAGADO'
    }
  })

  // Retiro en USD
  await prisma.transaction.create({
    data: {
      date: new Date('2026-03-08'),
      description: 'Compra Dólares Ahorro',
      amount: 100, // USD
      currency: 'USD',
      type: 'INCOME', // Ingreso a la cuenta USD (movimiento interno simplificado)
      accountId: accountUSD.id,
      categoryId: categories['Otros Ingresos'], 
      businessId: business.id,
      estado: 'COBRADO'
    }
  })

  // Productos
  await prisma.producto.create({
    data: {
      nombre: 'Consultoría Hora',
      categoria: 'Servicios',
      precioVenta: 50000,
      unidad: 'hora',
      stockActual: 100, // Horas disponibles teóricas
      businessId: business.id
    }
  })

  console.log(`✅ Seeding finished.`)
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