import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Empresa demo
  const empresa = await prisma.empresa.upsert({
    where: { nit: '900123456' },
    update: {},
    create: {
      nombre: 'Gym Demo',
      nit: '900123456',
      colorPrimario: '#2b8a3e',
      prefijoFactura: 'DEMO',
    },
  });

  // Super admin
  const passwordHash = await bcrypt.hash('secret123', 10);
  await prisma.user.upsert({
    where: { empresaId_email: { empresaId: empresa.id, email: 'admin@gym.com' } },
    update: {},
    create: {
      empresaId: empresa.id,
      nombre: 'Administrador',
      email: 'admin@gym.com',
      password: passwordHash,
      rol: 'super_admin',
    },
  });

  // Planes
  const planMensual = await prisma.plan.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      empresaId: empresa.id,
      nombre: 'Mensualidad',
      descripcion: 'Acceso 30 días',
      precio: 80000,
      duracionDias: 30,
    },
  });
  await prisma.plan.upsert({
    where: { id: '22222222-2222-4222-8222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-4222-8222-222222222222',
      empresaId: empresa.id,
      nombre: 'Quincenal',
      descripcion: 'Acceso 15 días',
      precio: 45000,
      duracionDias: 15,
    },
  });

  // Miembro demo
  await prisma.miembro.upsert({
    where: {
      empresaId_identificacion: { empresaId: empresa.id, identificacion: '1065853708' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      identificacion: '1065853708',
      tipoIdentificacion: 'CC',
      primerNombre: 'Kevin',
      primerApellido: 'Mendoza',
      segundoApellido: 'Gomez',
      fechaNacimiento: new Date('1999-10-10'),
      sexo: 'M',
      celular: '3044345354',
      correo: 'kevin@gym.com',
    },
  });

  // Categorías y productos (nevera)
  const cat = await prisma.categoriaProducto.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: 'Bebidas' } },
    update: {},
    create: { empresaId: empresa.id, nombre: 'Bebidas', tipo: 'consumible' },
  });
  await prisma.producto.upsert({
    where: {
      empresaId_nombre: { empresaId: empresa.id, nombre: 'Gaseosa 500ml' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      categoriaId: cat.id,
      nombre: 'Gaseosa 500ml',
      precioVenta: 3000,
      stockActual: 24,
      stockMinimo: 10,
      unidadMedida: 'unidad',
    },
  });
  await prisma.producto.upsert({
    where: {
      empresaId_nombre: { empresaId: empresa.id, nombre: 'Proteína 1kg' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      categoriaId: cat.id,
      nombre: 'Proteína 1kg',
      precioVenta: 120000,
      stockActual: 5,
      stockMinimo: 8,
      unidadMedida: 'unidad',
    },
  });

  // Máquina demo
  await prisma.maquina.upsert({
    where: {
      empresaId_serial: { empresaId: empresa.id, serial: 'MK-001' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      nombre: 'Press de banca',
      tipo: 'fuerza',
      marca: 'Life Fitness',
      serial: 'MK-001',
      ubicacion: 'Sala de pesas',
      estado: 'operativo',
    },
  });

  // Ejercicio demo
  const ej = await prisma.ejercicio.upsert({
    where: { id: '33333333-3333-4333-8333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-4333-8333-333333333333',
      empresaId: empresa.id,
      nombre: 'Press de banca',
      categoria: 'Pecho',
    },
  });

  // Rutina quincenal (15 días) con precio
  await prisma.frecuenciaRutina.upsert({
    where: { id: '44444444-4444-4444-8444-444444444444' },
    update: { precio: 45000 },
    create: {
      id: '44444444-4444-4444-8444-444444444444',
      empresaId: empresa.id,
      nombre: 'Rutina Quincenal Fuerza',
      tipoPeriodo: 'QUINCENA',
      duracionDias: 15,
      precio: 45000,
      descripcion: 'Ciclo de 15 días',
      ejercicios: {
        create: [
          {
            ejercicioId: ej.id,
            orden: 1,
            series: 4,
            repeticiones: '12-10-8',
            descansoMin: 2,
          },
        ],
      },
    },
  });

  // Rutina mensual con precio
  await prisma.frecuenciaRutina.upsert({
    where: { id: '66666666-6666-4666-8666-666666666666' },
    update: {},
    create: {
      id: '66666666-6666-4666-8666-666666666666',
      empresaId: empresa.id,
      nombre: 'Rutina Mensual Hipertrofia',
      tipoPeriodo: 'MES',
      duracionDias: 30,
      precio: 80000,
      descripcion: 'Ciclo de 30 días enfocado en hipertrofia',
    },
  });

  // Asignación demo que vence en 2 días (para el dashboard "próximos a vencer")
  const inicioAsignacion = new Date();
  inicioAsignacion.setDate(inicioAsignacion.getDate() - 13);
  await prisma.miembroRutina.upsert({
    where: { id: '55555555-5555-5555-8555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-8555-555555555555',
      empresaId: empresa.id,
      miembroId: (await prisma.miembro.findFirstOrThrow({
        where: { empresaId: empresa.id, identificacion: '1065853708' },
      })).id,
      frecuenciaId: '44444444-4444-4444-8444-444444444444',
      fechaInicio: inicioAsignacion,
      fechaFin: new Date(new Date().setDate(new Date().getDate() + 2)),
    },
  });

  // Colaboradores demo
  await prisma.colaborador.upsert({
    where: {
      empresaId_identificacion: { empresaId: empresa.id, identificacion: '79876543' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      nombre: 'Carlos Ramírez',
      identificacion: '79876543',
      celular: '3151234567',
      cargo: 'entrenador',
      estado: 'activo',
    },
  });
  await prisma.colaborador.upsert({
    where: {
      empresaId_identificacion: { empresaId: empresa.id, identificacion: '80123456' },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      nombre: 'Laura Martínez',
      identificacion: '80123456',
      celular: '3149876543',
      cargo: 'nutricionista',
      estado: 'activo',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seed completado. Empresa:', empresa.nombre);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
