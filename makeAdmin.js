import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin.domus.condominio@gmail.com';
  try {
    console.log(`Buscando a ${email} en la base de datos...`);
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN', status: 'ACTIVO' }
    });
    console.log(`✅ ¡Misión Cumplida! El usuario ${user.email} ahora es ADMIN y está ACTIVO.`);
  } catch (error) {
    console.error(`❌ Error al actualizar. ¿Estás seguro de que ya registraste ese correo en la página?`);
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();