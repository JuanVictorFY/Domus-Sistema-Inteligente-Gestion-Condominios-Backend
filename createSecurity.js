import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'seguridad@domus.com';
  const password = '123';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'SEGURIDAD' },
    create: {
      email,
      name: 'Oficial de Turno',
      password: hashedPassword,
      role: 'SEGURIDAD'
    },
  });

  console.log('✅ ¡Cuenta de Seguridad creada exitosamente en PostgreSQL!');
  console.log(`✉️  Correo: ${user.email}`);
  console.log(`🔑 Contraseña: ${password}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());