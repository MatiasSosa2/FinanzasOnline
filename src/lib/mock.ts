export const MOCK_ACCOUNTS = [
  { id: '1', name: 'Caja Principal (Demo)', type: 'CASH', currency: 'ARS', currentBalance: 1500000, businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Banco Galicia (Demo)', type: 'BANK', currency: 'ARS', currentBalance: 3200000, businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Caja USD (Demo)', type: 'CASH', currency: 'USD', currentBalance: 5000, businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
]

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Ventas', type: 'INCOME', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Servicios', type: 'INCOME', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Alquiler', type: 'EXPENSE', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'Sueldos', type: 'EXPENSE', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Proveedores', type: 'EXPENSE', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
]

export const MOCK_CONTACTS = [
  { id: '1', name: 'Cliente Demo', type: 'CLIENT', businessId: 'demo', phone: '123456', email: 'juan@cliente.com', taxId: null, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Proveedor Demo', type: 'SUPPLIER', businessId: 'demo', phone: '987654', email: 'contacto@tech.com', taxId: null, createdAt: new Date(), updatedAt: new Date() },
]

export const MOCK_AREAS = [
  { id: '1', nombre: 'Administración', descripcion: 'Oficina central', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nombre: 'Ventas', descripcion: 'Equipo comercial', businessId: 'demo', createdAt: new Date(), updatedAt: new Date() },
]

export const MOCK_TRANSACTIONS = [
  { 
    id: '1', description: 'Cobro factura A-0001', amount: 500000, currency: 'ARS', type: 'INCOME', date: new Date(), 
    esCredito: false, estado: 'COBRADO', fechaVencimiento: null, invoiceType: null, invoiceNumber: null, invoiceFileUrl: null,
    categoryId: '1', accountId: '1', contactId: '1', areaNegocioId: '2', businessId: 'demo',
    category: MOCK_CATEGORIES[0], account: MOCK_ACCOUNTS[0], contact: MOCK_CONTACTS[0], areaNegocio: MOCK_AREAS[1],
    createdAt: new Date(), updatedAt: new Date()
  },
  { 
    id: '2', description: 'Pago alquiler oficina', amount: 350000, currency: 'ARS', type: 'EXPENSE', date: new Date(Date.now() - 86400000 * 2), 
    esCredito: false, estado: 'PAGADO', fechaVencimiento: null, invoiceType: null, invoiceNumber: null, invoiceFileUrl: null,
    categoryId: '3', accountId: '2', contactId: null, areaNegocioId: '1', businessId: 'demo',
    category: MOCK_CATEGORIES[2], account: MOCK_ACCOUNTS[1], contact: null, areaNegocio: MOCK_AREAS[0],
    createdAt: new Date(), updatedAt: new Date()
  },
  { 
    id: '3', description: 'Venta de servicios consultoría', amount: 1200, currency: 'USD', type: 'INCOME', date: new Date(Date.now() - 86400000 * 5), 
    esCredito: false, estado: 'COBRADO', fechaVencimiento: null, invoiceType: null, invoiceNumber: null, invoiceFileUrl: null,
    categoryId: '2', accountId: '3', contactId: '1', areaNegocioId: '2', businessId: 'demo',
    category: MOCK_CATEGORIES[1], account: MOCK_ACCOUNTS[2], contact: MOCK_CONTACTS[0], areaNegocio: MOCK_AREAS[1],
    createdAt: new Date(), updatedAt: new Date()
  },
]

export const MOCK_PRODUCTOS = [
  { id: '1', nombre: 'Producto Demo A', descripcion: null, categoria: null, marca: null, unidad: 'unidad', metodoCosteo: 'PROMEDIO', currency: 'ARS', precioVenta: 100, precioCosto: 50, stockActual: 100, enTransito: 0, activo: true, businessId: 'demo', createdAt: new Date(), updatedAt: new Date(), movimientos: [] },
]

export const MOCK_BIENES = []
