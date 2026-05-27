import express from 'express';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const parseId = (id) => /^\d+$/.test(id) ? parseInt(id, 10) : id;

const EMAIL_FROM = 'Domus - Condominios <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const sendMail = ({ to, subject, html }) =>
  resend.emails.send({ from: EMAIL_FROM, to, subject, html })
    .then(() => console.log(`[Correo] ✅ Enviado → ${to}`))
    .catch((err) => console.error(`[Correo] ❌ Error → ${to}:`, err.message));

// Helper: plantilla de correo de bienvenida
const buildWelcomeEmail = ({ name, roleName, password, isApproval = false }) => `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
    <div style="background:linear-gradient(135deg,#0056b3,#00d4ff);padding:40px 20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:3px;font-weight:800;">DOMUS</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Sistema Inteligente de Gestión</p>
    </div>
    <div style="padding:40px 35px;background:#0f172a;">
      <h2 style="color:#fff;margin-top:0;">¡Hola, ${name}!</h2>
      <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">
        ${isApproval
          ? `Tu solicitud de registro como <strong style="color:#fff;">${roleName}</strong> ha sido <strong style="color:#00d4ff;">aprobada</strong> por la administración.`
          : `La administración te ha registrado como <strong style="color:#fff;">${roleName}</strong> en el sistema Domus.`
        }
      </p>
      <p style="color:#cbd5e1;font-size:16px;margin-bottom:6px;">Tu contraseña de acceso temporal es:</p>
      <div style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;background:#1e293b;border:2px solid #00d4ff;border-radius:12px;padding:16px 40px;font-size:28px;font-weight:800;letter-spacing:6px;color:#00d4ff;font-family:monospace;">${password}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin-bottom:32px;">Por seguridad, te recomendamos cambiar esta contraseña al iniciar sesión por primera vez.</p>
      <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:32px 0 20px;">
      <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
        Este mensaje fue enviado automáticamente desde <strong>${EMAIL_FROM}</strong><br>
        © ${new Date().getFullYear()} Domus. Todos los derechos reservados.
      </p>
    </div>
  </div>
`;

// Helper para generar contraseñas de 8 caracteres
const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// GET /api/users — Directorio de residentes (con paginación y búsqueda)
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const role   = req.query.role;
    const status = req.query.status;
    const search = req.query.search;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { depto: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo cargar el directorio' });
  }
});

// POST /api/users — El admin crea un usuario manualmente y envía correo de bienvenida
router.post('/', async (req, res) => {
  try {
    const { name, email, depto, phone, role, status } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'El correo ya está registrado.' });

    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name || 'Usuario',
        email,
        password: hashedPassword,
        depto: depto || 'N/A',
        phone: phone || '',
        role: role || 'RESIDENTE',
        status: status || 'ACTIVO'
      }
    });

    const roleName = newUser.role === 'SEGURIDAD' ? 'Personal de Seguridad'
      : newUser.role === 'ADMIN' ? 'Administrador' : 'Residente';

    // Responder de inmediato con la contraseña generada (para que el admin pueda comunicarla)
    res.status(201).json({ ...newUser, emailSent: true, generatedPassword });

    sendMail({
      to: newUser.email,
      subject: `¡Bienvenido a Domus! Tu cuenta de ${roleName} ha sido creada`,
      html: buildWelcomeEmail({ name: newUser.name, roleName, password: generatedPassword })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el usuario en la base de datos.' });
  }
});

// PUT /api/users/:id/approve — Admin aprueba solicitud de registro
router.put('/:id/approve', async (req, res) => {
  console.log(`[Backend] 🟢 Aprobando usuario ID: ${req.params.id}`);
  try {
    const { id } = req.params;
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = await prisma.user.update({
      where: { id: parseId(id) },
      data: { status: 'ACTIVO', password: hashedPassword }
    });

    const roleName = user.role === 'SEGURIDAD' ? 'Personal de Seguridad'
      : user.role === 'ADMIN' ? 'Administrador' : 'Residente';

    res.json({ message: 'Usuario aprobado y correo enviado.', user });

    sendMail({
      to: user.email,
      subject: `¡Bienvenido a Domus! Tu solicitud de ${roleName} ha sido aprobada`,
      html: buildWelcomeEmail({ name: user.name, roleName, password: generatedPassword, isApproval: true })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'No se pudo aprobar al usuario.' });
  }
});

// PUT /api/users/:id/reject — Admin rechaza solicitud de registro
router.put('/:id/reject', async (req, res) => {
  console.log(`[Backend] 🔴 Rechazando usuario ID: ${req.params.id}`);
  try {
    const { id } = req.params;
    const userToDelete = await prisma.user.findUnique({ where: { id: parseId(id) } });

    if (userToDelete) {
      await prisma.user.delete({ where: { id: parseId(id) } });

      const roleName = userToDelete.role === 'SEGURIDAD' ? 'Personal de Seguridad'
        : userToDelete.role === 'ADMIN' ? 'Administrador' : 'Residente';

      sendMail({
        to: userToDelete.email,
        subject: `Actualización de Solicitud de Registro (${roleName})`,
        html: `
          <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;">
            <div style="background:linear-gradient(135deg,#dc3545,#ff6b6b);padding:40px 20px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:3px;font-weight:800;">DOMUS</h1>
            </div>
            <div style="padding:40px 35px;background:#0f172a;">
              <h2 style="color:#fff;margin-top:0;">Solicitud No Aprobada</h2>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Hola <strong>${userToDelete.name}</strong>,</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Lamentamos informarte que la administración no ha podido aprobar tu solicitud de registro como <strong>${roleName}</strong> en este momento.</p>
              <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Si consideras que esto es un error, por favor contacta directamente a la administración del condominio.</p>
              <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:32px 0 20px;">
              <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">© ${new Date().getFullYear()} Domus.</p>
            </div>
          </div>
        `
      });
    }

    res.json({ message: 'Usuario rechazado y eliminado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'No se pudo rechazar al usuario.' });
  }
});

// PUT /api/users/:id — Editar perfil de un usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, depto, phone, role, status } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: parseId(id) },
      data: { name, email, depto, phone, role, status }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// DELETE /api/users/:id — Eliminar usuario y sus registros relacionados
router.delete('/:id', async (req, res) => {
  try {
    const uid = parseId(req.params.id);
    await prisma.$transaction([
      prisma.visitor.deleteMany({ where: { userId: uid } }),
      prisma.reservation.deleteMany({ where: { userId: uid } }),
      prisma.parcel.deleteMany({ where: { userId: uid } }),
      prisma.vehicle.deleteMany({ where: { userId: uid } }),
      prisma.pet.deleteMany({ where: { userId: uid } }),
      prisma.familyMember.deleteMany({ where: { userId: uid } }),
      prisma.ticket.updateMany({ where: { userId: uid }, data: { userId: null } }),
      prisma.user.delete({ where: { id: uid } }),
    ]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// POST /api/users/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'domus_secret', { expiresIn: '15m' });
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    await sendMail({
      to: user.email,
      subject: 'Recuperación de Contraseña — Domus',
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;">
          <div style="background:linear-gradient(135deg,#0056b3,#00d4ff);padding:40px 20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:3px;font-weight:800;">DOMUS</h1>
          </div>
          <div style="padding:40px 35px;background:#0f172a;">
            <h2 style="color:#fff;margin-top:0;">Restablecer Contraseña</h2>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Hola <strong>${user.name}</strong>,</p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón a continuación. Este enlace expirará en <strong>15 minutos</strong>.</p>
            <div style="text-align:center;margin:36px 0;">
              <a href="${resetLink}" style="display:inline-block;padding:16px 44px;background:linear-gradient(45deg,#0056b3,#00d4ff);color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;">RESTABLECER CONTRASEÑA</a>
            </div>
            <p style="color:#94a3b8;font-size:13px;text-align:center;">Si no solicitaste esto, ignora este correo de forma segura.</p>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:32px 0 20px;">
            <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">© ${new Date().getFullYear()} Domus.</p>
          </div>
        </div>
      `
    });
    res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// POST /api/users/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'domus_secret');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    await sendMail({
      to: user.email,
      subject: 'Contraseña actualizada — Domus',
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <div style="background:linear-gradient(135deg,#0056b3,#00d4ff);padding:40px 20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:3px;font-weight:800;">DOMUS</h1>
            <p style="color:rgba(255,255,255,0.9);margin:5px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Sistema Inteligente de Gestión</p>
          </div>
          <div style="padding:40px 35px;background:#0f172a;">
            <h2 style="color:#fff;margin-top:0;">¡Contraseña Actualizada! <span style="color:#00d4ff;">✓</span></h2>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Hola <strong style="color:#fff;">${user.name}</strong>,</p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">La contraseña de tu cuenta ha sido modificada exitosamente.</p>
            <div style="background:rgba(0,212,255,0.05);border-left:4px solid #00d4ff;padding:20px;margin:30px 0;border-radius:0 8px 8px 0;">
              <p style="color:#94a3b8;margin:0;font-size:14px;line-height:1.6;">Si tú realizaste este cambio, puedes ignorar este mensaje. Si no fuiste tú, contacta a administración de inmediato.</p>
            </div>
            <div style="text-align:center;margin:36px 0 20px;">
              <a href="${FRONTEND_URL}/login" style="display:inline-block;padding:16px 44px;background:linear-gradient(45deg,#0056b3,#00d4ff);color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:1px;">INICIAR SESIÓN</a>
            </div>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:32px 0 20px;">
            <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">© ${new Date().getFullYear()} Domus. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    });
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'El enlace es inválido o ha expirado.' });
  }
});

export default router;
