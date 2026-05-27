import express from 'express';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin.domus.condominio@gmail.com';

// POST /api/contact - Enviar mensaje de contacto desde la landing
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres.' });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b;">
        <div style="background:linear-gradient(135deg,#0056b3,#00d4ff);padding:30px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">DOMUS</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Nuevo mensaje desde la web</p>
        </div>
        <div style="padding:30px;">
          <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Nombre:</strong> ${name}</p>
          <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Correo:</strong> ${email}</p>
          <p style="color:#94a3b8;"><strong style="color:#e2e8f0;">Mensaje:</strong></p>
          <div style="background:rgba(255,255,255,0.05);border-left:4px solid #00d4ff;padding:15px;border-radius:0 8px 8px 0;">
            <p style="color:#cbd5e1;margin:0;line-height:1.6;">${message}</p>
          </div>
        </div>
      </div>`;

    sendEmail({ to: ADMIN_EMAIL, subject: `Contacto web — ${name}`, html });
    res.json({ message: 'Mensaje recibido. Te contactaremos pronto.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar el mensaje.' });
  }
});

export default router;
