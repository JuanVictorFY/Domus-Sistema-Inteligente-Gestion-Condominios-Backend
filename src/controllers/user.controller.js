import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (req, res) => {
  try {
    // Traemos todos los usuarios pero excluimos la contraseña por seguridad
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, depto: true, phone: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el listado de usuarios.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario.' });
  }
};