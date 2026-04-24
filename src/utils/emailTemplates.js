const BASE = (content) => `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
  <div style="background:linear-gradient(135deg,#0056b3,#00d4ff);padding:40px 20px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:32px;letter-spacing:3px;font-weight:800;">DOMUS</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Sistema Inteligente de Gestión</p>
  </div>
  <div style="padding:40px 35px;background:#0f172a;">${content}</div>
  <div style="padding:20px;background:#0f172a;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">© ${new Date().getFullYear()} Domus. Todos los derechos reservados.</p>
  </div>
</div>`;

export const welcomeTemplate = ({ name, roleName, password, isApproval = false }) => BASE(`
  <h2 style="color:#fff;margin-top:0;">¡Hola, ${name}!</h2>
  <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">
    ${isApproval
      ? `Tu solicitud como <strong style="color:#fff;">${roleName}</strong> ha sido <strong style="color:#00d4ff;">aprobada</strong>.`
      : `La administración te ha registrado como <strong style="color:#fff;">${roleName}</strong> en Domus.`
    }
  </p>
  <p style="color:#cbd5e1;font-size:16px;">Tu contraseña temporal:</p>
  <div style="text-align:center;margin:20px 0;">
    <span style="display:inline-block;background:#1e293b;border:2px solid #00d4ff;border-radius:12px;padding:16px 40px;font-size:28px;font-weight:800;letter-spacing:6px;color:#00d4ff;font-family:monospace;">${password}</span>
  </div>
  <p style="color:#94a3b8;font-size:13px;text-align:center;">Cambia esta contraseña al iniciar sesión por primera vez.</p>
`);

export const resetPasswordTemplate = ({ name, resetLink }) => BASE(`
  <h2 style="color:#fff;margin-top:0;">Restablecer Contraseña</h2>
  <p style="color:#cbd5e1;font-size:16px;line-height:1.6;">Hola <strong>${name}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
  <div style="text-align:center;margin:36px 0;">
    <a href="${resetLink}" style="display:inline-block;padding:16px 44px;background:linear-gradient(45deg,#0056b3,#00d4ff);color:#fff;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;">RESTABLECER CONTRASEÑA</a>
  </div>
  <p style="color:#94a3b8;font-size:13px;text-align:center;">Este enlace expira en 15 minutos. Si no solicitaste esto, ignora este correo.</p>
`);

export const passwordChangedTemplate = ({ name, loginUrl }) => BASE(`
  <h2 style="color:#fff;margin-top:0;">Contraseña Actualizada ✓</h2>
  <p style="color:#cbd5e1;font-size:16px;">Hola <strong>${name}</strong>, tu contraseña ha sido modificada exitosamente.</p>
  <div style="background:rgba(0,212,255,0.05);border-left:4px solid #00d4ff;padding:20px;margin:30px 0;border-radius:0 8px 8px 0;">
    <p style="color:#94a3b8;margin:0;font-size:14px;">Si no realizaste este cambio, contacta a administración de inmediato.</p>
  </div>
  <div style="text-align:center;margin:36px 0;">
    <a href="${loginUrl}" style="display:inline-block;padding:16px 44px;background:linear-gradient(45deg,#0056b3,#00d4ff);color:#fff;text-decoration:none;border-radius:50px;font-weight:700;">INICIAR SESIÓN</a>
  </div>
`);
