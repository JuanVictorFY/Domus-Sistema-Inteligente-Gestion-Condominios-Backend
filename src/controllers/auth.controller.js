import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Clave secreta para firmar los tokens (Idealmente debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secreto_domus_123';

export const register = async (req, res) => {
  try {
    const { email, password, name, role, depto, phone } = req.body;

    // 1. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear el usuario en la BD
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'RESIDENTE',
        depto,
        phone
      }
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrar usuario.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Flujo de Admin Principal (Backdoor) ---
    // Utilizamos .trim() para evitar errores si copias y pegas con espacios extra
    if (email?.trim() === 'admin.domus.condominio@gmail.com' && password?.trim() === 'temp_password') {
        const token = jwt.sign(
          { id: 9999, role: 'ADMIN', email: email.trim() },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        return res.json({
          message: 'Login exitoso',
          token,
          user: {
            id: 9999,
            name: 'Administrador Principal',
            email: email.trim(),
            role: 'admin',
            depto: 'Administración'
          }
        });
    }

    // 1. Buscar al usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 1.5 Verificar que el usuario esté activo
    if (user.status === 'PENDIENTE') {
      return res.status(403).json({ message: 'Tu cuenta aún está pendiente de aprobación por el administrador.' });
    }
    if (user.status === 'INACTIVO') {
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    // 2. Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // 3. Generar el Token (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 4. Enviar respuesta al frontend
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        depto: user.depto
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
  }
};