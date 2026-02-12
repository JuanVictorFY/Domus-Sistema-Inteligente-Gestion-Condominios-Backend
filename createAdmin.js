import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ⚠️ Cambia estos datos por los del nuevo administrador que desees crear
  const email = 'nuevo.admin@domus.com';
  const password = '123';
  const name = 'Admin Secundario';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'ADMIN', status: 'ACTIVO', name },
    create: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVO', // Se crea directamente como activo
      depto: 'Administración'
    },
  });

  console.log('✅ ¡Cuenta de Administrador creada exitosamente en la Base de Datos!');
  console.log(`✉️  Correo: ${user.email}`);
  console.log(`🔑 Contraseña: ${password}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());