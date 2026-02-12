import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Buscando solicitudes pendientes en la base de datos...');
    const result = await prisma.user.deleteMany({
      where: { status: 'PENDIENTE' }
    });
    console.log(`✅ ¡Limpieza completada! Se eliminaron ${result.count} solicitudes pendientes de la base de datos.`);
  } catch (error) {
    console.error('❌ Error al intentar limpiar la base de datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();