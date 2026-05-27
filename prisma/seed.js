import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const adminPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@domus.com' },
    update: {},
    create: {
      name: 'Administrador Domus',
      email: 'admin@domus.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVO',
      depto: null,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  const areas = [
    { name: 'Piscina',        capacity: '20 personas', status: 'Activa',       color: 'success', icon: 'bi-water' },
    { name: 'Salón de Fiestas', capacity: '50 personas', status: 'Activa',    color: 'success', icon: 'bi-balloon' },
    { name: 'Gimnasio',       capacity: '15 personas', status: 'Activa',       color: 'success', icon: 'bi-activity' },
    { name: 'Sala de Reuniones', capacity: '10 personas', status: 'Activa',   color: 'success', icon: 'bi-people' },
    { name: 'Cancha de Tenis', capacity: '4 personas', status: 'Mantenimiento', color: 'warning', icon: 'bi-trophy' },
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { id: areas.indexOf(area) + 1 },
      update: {},
      create: area,
    });
  }
  console.log(`✅ ${areas.length} áreas creadas`);

  const announcement = await prisma.announcement.create({
    data: {
      title: 'Bienvenidos a Domus',
      desc: 'El sistema de gestión inteligente del condominio ya está disponible para todos los residentes.',
      scope: 'Todos',
      type: 'info',
    },
  });
  console.log(`✅ Comunicado inicial creado: ${announcement.title}`);

  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
