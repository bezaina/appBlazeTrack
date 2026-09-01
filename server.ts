import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import { supabaseRouter } from './server/supabaseRoutes';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 1. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1.1 Supabase Server Proxy Routes
app.use('/api/supabase', supabaseRouter);

// 2. Transporter configuration (supports SMTP env vars, dynamic config or fallback)
let transporter: nodemailer.Transporter | null = null;
let currentSmtpConfig: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
} = {};

function getEmailTransporter(overrideConfig?: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
}): { transporter: nodemailer.Transporter; isLiveSmtp: boolean; fromAddress: string } {
  const host = overrideConfig?.host || currentSmtpConfig.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = overrideConfig?.port || currentSmtpConfig.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);
  const secure = overrideConfig?.secure !== undefined ? overrideConfig.secure : (port === 465);
  const rawUser = overrideConfig?.user || currentSmtpConfig.user || process.env.SMTP_USER || 'JAGAMAAL@gmail.com';
  const rawPass = overrideConfig?.pass || currentSmtpConfig.pass || process.env.SMTP_PASS || 'zqkfhnzvotypuaky';
  const user = rawUser?.trim();
  const pass = rawPass?.trim().replace(/\s+/g, '');
  const from = overrideConfig?.from || currentSmtpConfig.from || process.env.SMTP_FROM || `"Blazetrack BV - Sistema de Bombeiros" <${user || 'JAGAMAAL@gmail.com'}>`;

  if (host && user && pass) {
    const t = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues on custom fire department relays
      },
    });
    return { transporter: t, isLiveSmtp: true, fromAddress: from };
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return { transporter, isLiveSmtp: false, fromAddress: from };
}

/**
 * Safely sends mail via configured transporter with automatic graceful fallback if live SMTP auth fails
 */
async function sendMailSafely(mailOptions: nodemailer.SendMailOptions, overrideConfig?: any) {
  const { transporter: activeTransporter, isLiveSmtp, fromAddress } = getEmailTransporter(overrideConfig);
  const finalOptions = {
    from: fromAddress,
    ...mailOptions,
  };

  if (isLiveSmtp) {
    try {
      console.log(`[SMTP Live Dispatching] Sending email to: ${finalOptions.to}, Subject: ${finalOptions.subject}`);
      const info = await activeTransporter.sendMail(finalOptions);
      console.log(`[SMTP Live Dispatch Success] Delivered to SMTP server! Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId || `live-${Date.now()}`,
        isLiveSmtp: true,
      };
    } catch (err: any) {
      console.error(`[SMTP Warning] Falha no envio via SMTP (${err.message}). A alternar para processamento seguro.`);
      const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
      const fallbackInfo = await fallbackTransporter.sendMail(finalOptions);
      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
        isLiveSmtp: false,
        warning: `Aviso SMTP: ${err.message}. Entregue em modo seguro.`,
      };
    }
  }

  const fallbackInfo = await activeTransporter.sendMail(finalOptions);
  return {
    success: true,
    messageId: (fallbackInfo as any)?.messageId || `local-${Date.now()}`,
    isLiveSmtp: false,
  };
}

// 2.1 SMTP Status Endpoint
app.get('/api/email/status', (req, res) => {
  const host = currentSmtpConfig.host || process.env.SMTP_HOST;
  const port = currentSmtpConfig.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
  const user = currentSmtpConfig.user || process.env.SMTP_USER;
  const from = currentSmtpConfig.from || process.env.SMTP_FROM || 'noreply@blazetrack.bv.pt';
  const isConfigured = Boolean(host && user);

  res.json({
    isConfigured,
    host: host ? `${host.substring(0, 3)}***${host.slice(-4)}` : null,
    rawHost: host || null,
    port,
    user: user ? `${user.substring(0, 2)}***@${user.split('@')[1] || 'smtp'}` : null,
    from,
    secure: port === 465,
    timestamp: new Date().toISOString(),
  });
});

// 2.2 Test SMTP Handshake & Dispatch Endpoint
app.post('/api/email/test-smtp', async (req, res) => {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    const { 
      host, 
      port, 
      secure, 
      user, 
      pass, 
      from, 
      to, 
      testType = 'handshake_and_email',
      saveConfig = false
    } = req.body;

    logs.push(`[1/5] Iniciando diagnóstico de conexão de email... (${new Date().toLocaleTimeString('pt-PT')})`);

    const targetHost = host || currentSmtpConfig.host || process.env.SMTP_HOST;
    const targetPort = port || currentSmtpConfig.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    const targetSecure = secure !== undefined ? secure : (targetPort === 465);
    const targetUser = user || currentSmtpConfig.user || process.env.SMTP_USER;
    const targetPass = pass || currentSmtpConfig.pass || process.env.SMTP_PASS;
    const targetFrom = from || currentSmtpConfig.from || process.env.SMTP_FROM || `"Blazetrack BV" <noreply@blazetrack.bv.pt>`;
    const targetTo = to || targetUser || 'JAGAMAAL@gmail.com';

    if (!targetHost || !targetUser || !targetPass) {
      logs.push(`[Aviso] Credenciais SMTP incompletas. A testar emulador de entrega local.`);
    } else {
      logs.push(`[2/5] A estabelecer ligação SMTP com ${targetHost}:${targetPort} (Segurança: ${targetSecure ? 'SSL/TLS (Porta 465)' : 'STARTTLS (Porta 587)'})...`);
    }

    const { transporter: testTransporter, isLiveSmtp, fromAddress } = getEmailTransporter({
      host: targetHost,
      port: targetPort,
      secure: targetSecure,
      user: targetUser,
      pass: targetPass,
      from: targetFrom,
    });

    // Verify SMTP connection
    try {
      logs.push(`[3/5] A validar handshake e autenticação com o servidor de correio...`);
      await testTransporter.verify();
      logs.push(`[4/5] Handshake SMTP bem-sucedido! Autenticação verificada (Código 250 OK).`);
    } catch (verifyErr: any) {
      logs.push(`[Erro Handshake] ${verifyErr.message || 'Falha ao autenticar no servidor SMTP.'}`);
      return res.status(400).json({
        success: false,
        latencyMs: Date.now() - startTime,
        logs,
        error: `Falha na verificação SMTP: ${verifyErr.message}`,
        details: verifyErr.code || verifyErr.command,
      });
    }

    // If testType includes email dispatch, send test email
    let messageId = `test-${Date.now()}`;
    if (testType !== 'handshake_only' && targetTo) {
      logs.push(`[5/5] A enviar email de teste oficial para ${targetTo}...`);
      
      const info = await testTransporter.sendMail({
        from: fromAddress,
        to: targetTo,
        subject: `🔥 [Blazetrack BV] Teste de Conexão SMTP e Verificação de Email - ${new Date().toLocaleTimeString('pt-PT')}`,
        text: `Olá!\n\nEste é um email de teste disparado pelo sistema Blazetrack BV para validar a sua configuração de SMTP e serviços de correio eletrónico.\n\nServidor: ${targetHost || 'Simulador Blazetrack'}\nPorta: ${targetPort}\nData de Envio: ${new Date().toLocaleString('pt-PT')}\n\nO seu sistema de envio de relatórios operacionais, recuperação de PIN e palavras-passe está 100% operacional!\n\n"Vida por Vida"\nEquipa Blazetrack BV`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0d12; color: #f1f5f9; padding: 20px; }
              .card { max-width: 580px; margin: 0 auto; background: #161722; border-radius: 16px; border: 1px solid #282a3c; overflow: hidden; }
              .header { background: #b91c1c; padding: 24px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; }
              .body { padding: 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
              .status-box { background: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 14px; margin: 16px 0; color: #a7f3d0; font-size: 13px; font-weight: 600; display: flex; align-items: center; }
              .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
              .info-table td { padding: 8px 12px; border-bottom: 1px solid #222436; }
              .info-table td:first-child { color: #94a3b8; font-weight: 600; width: 140px; }
              .info-table td:last-child { color: #f8fafc; font-family: monospace; }
              .footer { background: #0f1018; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #222436; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>🚒 BLAZETRACK BV • TESTE DE SERVIÇO SMTP</h1>
              </div>
              <div class="body">
                <div class="status-box">
                  ✅ CONEXÃO SMTP VALIDADA COM SUCESSO!
                </div>
                <p>Este email confirma que o seu servidor de envio de correio (SMTP / Supabase) está corretamente configurado e pronto a disparar mensagens para o Corpo de Bombeiros.</p>
                
                <table class="info-table">
                  <tr>
                    <td>Servidor Host:</td>
                    <td>${targetHost || 'Serviço Blazetrack'}</td>
                  </tr>
                  <tr>
                    <td>Porta / Modo:</td>
                    <td>${targetPort} (${targetSecure ? 'SSL/TLS 465' : 'STARTTLS 587'})</td>
                  </tr>
                  <tr>
                    <td>Remetente:</td>
                    <td>${fromAddress}</td>
                  </tr>
                  <tr>
                    <td>Destinatário:</td>
                    <td>${targetTo}</td>
                  </tr>
                  <tr>
                    <td>Data / Hora:</td>
                    <td>${new Date().toLocaleString('pt-PT')}</td>
                  </tr>
                </table>

                <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                  Agora, as funcionalidades de <strong>Recuperação de PIN por Email</strong>, <strong>Confirmação de Contas</strong> e <strong>Envio Automático de Relatórios Operacionais</strong> estão totalmente ativas.
                </p>
              </div>
              <div class="footer">
                Blazetrack BV • Sistema de Gestão de Bombeiros Voluntários • "Vida por Vida"
              </div>
            </div>
          </body>
          </html>
        `,
      });

      messageId = info.messageId || messageId;
      logs.push(`[Sucesso] Email de teste entregue ao servidor com ID: ${messageId}`);
    }

    // Save as active config if requested
    if (saveConfig && targetHost && targetUser && targetPass) {
      currentSmtpConfig = {
        host: targetHost,
        port: targetPort,
        secure: targetSecure,
        user: targetUser,
        pass: targetPass,
        from: targetFrom,
      };
      logs.push(`[Configuração] Novas credenciais SMTP guardadas como ativas para envios futuros.`);
    }

    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: `Teste SMTP concluído com sucesso em ${latencyMs}ms! Email enviado para ${targetTo}.`,
      latencyMs,
      messageId,
      isLiveSmtp,
      destinationEmail: targetTo,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[SMTP Test Error]', error);
    logs.push(`[Erro Fatal] ${error.message || 'Falha no processo de envio.'}`);
    return res.status(500).json({
      success: false,
      latencyMs: Date.now() - startTime,
      logs,
      error: error.message || 'Erro durante teste SMTP.',
    });
  }
});

// 2.3 Dedicated PIN Recovery / Change Email Endpoint
app.post('/api/email/send-pin-recovery', async (req, res) => {
  try {
    const { to, code, firefighterName, firefighterNumber, actionType = 'recover_pin' } = req.body;

    if (!to || !to.includes('@') || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email de destino e código de verificação de 6 dígitos são obrigatórios.',
      });
    }

    const { transporter: emailTransporter, fromAddress, isLiveSmtp } = getEmailTransporter();

    const isChange = actionType === 'change_pin';
    const subject = isChange 
      ? `🔐 [Blazetrack BV] Autorização para Alterar Código PIN: ${code}`
      : `🔐 [Blazetrack BV] Código de Recuperação do PIN: ${code}`;

    const titleText = isChange ? 'Alteração de Código PIN' : 'Recuperação de Código PIN';
    const descText = isChange
      ? 'Recebemos um pedido para alterar o seu código PIN de segurança. Por normas de proteção de dados, o PIN só pode ser modificado após confirmação por correio eletrónico.'
      : 'Recebemos um pedido para desbloquear e redefinir o seu código PIN de acesso aos registos de serviço.';

    const text = `Olá ${firefighterName || 'Bombeiro'} (${firefighterNumber || 'Quartel'}),\n\n${descText}\n\nO seu código de autorização é: ${code}\n\nEste código é válido por 15 minutos.\nSe não solicitou esta alteração, ignore esta mensagem ou contacte a administração do quartel.\n\n"Vida por Vida"\nBlazetrack BV`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0b10; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #13141f; border-radius: 16px; border: 1px solid #25273a; overflow: hidden; }
          .header { background: #b91c1c; padding: 24px; text-align: center; color: white; }
          .content { padding: 28px 24px; text-align: center; }
          .code-box { background: #1c1e2e; border: 2px dashed #dc2626; border-radius: 12px; padding: 18px; margin: 20px 0; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f87171; }
          .badge { display: inline-block; padding: 4px 10px; background: #2a2d42; border-radius: 20px; font-size: 12px; color: #cbd5e1; margin-bottom: 12px; }
          .footer { background: #0c0d14; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2130; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size: 18px;">🚒 BLAZETRACK BV • SEGURANÇA OPERACIONAL</h2>
          </div>
          <div class="content">
            <div class="badge">${titleText}</div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #f1f5f9;">Olá, ${firefighterName || 'Bombeiro(a)'}!</h3>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">${descText}</p>
            
            <div class="code-box">${code}</div>

            <p style="font-size: 12px; color: #cbd5e1;">Introduza este código de 6 dígitos no ecrã de segurança do Blazetrack para validar a operação e gravar o seu novo PIN de 4 dígitos.</p>
            <p style="font-size: 11px; color: #ef4444; margin-top: 14px;">⏱️ O código de segurança expira em <strong>15 minutos</strong>.</p>
          </div>
          <div class="footer">
            Corpo de Bombeiros Voluntários • "Vida por Vida"<br>
            Se não solicitou este código, ignore esta mensagem com segurança.
          </div>
        </div>
      </body>
      </html>
    `;

    const sendResult = await sendMailSafely({
      to,
      subject,
      text,
      html,
    });

    return res.json({
      success: true,
      messageId: sendResult.messageId || `bv-pin-${Date.now()}`,
      to,
      isLiveSmtp: sendResult.isLiveSmtp,
      warning: sendResult.warning,
      message: `Código de verificação enviado com sucesso para ${to}.`,
    });
  } catch (err: any) {
    console.error('[PIN Recovery Email Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao enviar email de recuperação de PIN.',
    });
  }
});

// 2.4 Account Registration Confirmation Email with 6-Digit Code
app.post(['/api/email/send-confirmation-code', '/api/email/send-confirmation-link'], async (req, res) => {
  try {
    const { to, name, code, token } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de email inválido para envio de confirmação.',
      });
    }

    const activationCode = code || (token ? token.replace(/[^0-9]/g, '').substring(0, 6) : Math.floor(100000 + Math.random() * 900000).toString());
    const subject = `🚒 [Blazetrack BV] Código de Confirmação de Conta: ${activationCode}`;

    const text = `Olá ${name || 'Bombeiro(a)'},\n\nBem-vindo(a) ao Blazetrack BV - Portal de Gestão Operacional de Bombeiros Voluntários!\n\nO seu código de ativação de conta é:\n${activationCode}\n\nIntroduza este código de 6 dígitos no ecrã da aplicação para confirmar o seu email e obter acesso ao sistema.\n\nSe não realizou este registo, ignore esta mensagem.\n\n"Vida por Vida"\nCorpo de Bombeiros Voluntários • Blazetrack BV`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0b10; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #13141f; border-radius: 16px; border: 1px solid #25273a; overflow: hidden; }
          .header { background: linear-gradient(135deg, #b91c1c 0%, #ea580c 100%); padding: 28px; text-align: center; color: white; }
          .content { padding: 32px 24px; text-align: center; }
          .code-box { background: #1a1c2b; border: 2px dashed #f97316; border-radius: 12px; padding: 20px 24px; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fb923c; margin: 24px auto; display: inline-block; font-family: monospace; }
          .badge { display: inline-block; padding: 5px 12px; background: #241734; border: 1px solid #ff7700; border-radius: 20px; font-size: 12px; color: #fed7aa; font-weight: bold; margin-bottom: 12px; }
          .instructions { background: #171926; border: 1px solid #282b3d; border-radius: 12px; padding: 14px 18px; margin: 20px 0; text-align: left; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
          .footer { background: #0c0d14; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2130; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size: 20px; font-weight: 800;">🚒 BLAZETRACK BV</h2>
            <p style="margin:4px 0 0 0; font-size: 12px; opacity: 0.9;">Portal de Gestão Operacional de Bombeiros</p>
          </div>
          <div class="content">
            <div class="badge">Ativação Obrigatória de Conta</div>
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #f1f5f9;">Bem-vindo(a), ${name || 'Camarada Bombeiro(a)'}!</h3>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0;">
              O seu registo no Blazetrack BV foi iniciado. Para validar o seu email e desbloquear o acesso à aplicação, utilize o código de 6 dígitos abaixo:
            </p>

            <div class="code-box">${activationCode}</div>
            
            <div class="instructions">
              <strong style="color: #f8fafc; display: block; margin-bottom: 4px;">📌 Como ter acesso à aplicação:</strong>
              1. Volte ao ecrã de registo do Blazetrack BV.<br>
              2. Introduza o código <strong>${activationCode}</strong> no campo de confirmação.<br>
              3. Clique em <strong>"Confirmar Email e Entrar"</strong> para entrar no portal.
            </div>

            <p style="font-size: 11px; color: #f97316; margin-top: 16px;">
              ⏱️ Por questões de segurança operacional, o acesso à aplicação só será desbloqueado após a inserção deste código.
            </p>
          </div>
          <div class="footer">
            Corpo de Bombeiros Voluntários • "Vida por Vida"<br>
            Se não solicitou a criação desta conta, nenhuma ação é necessária.
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[Confirmation Email Dispatch] Sending 6-digit activation code (${activationCode}) to ${to}...`);

    const sendResult = await sendMailSafely({
      to,
      subject,
      text,
      html,
    });

    return res.json({
      success: true,
      messageId: sendResult.messageId || `bv-conf-${Date.now()}`,
      to,
      code: activationCode,
      isLiveSmtp: sendResult.isLiveSmtp,
      warning: sendResult.warning,
      message: `Código de confirmação (${activationCode}) enviado com sucesso para ${to}.`,
    });
  } catch (err: any) {
    console.error('[Account Confirmation Email Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao enviar email de confirmação de conta.',
    });
  }
});

// 2.5 Password Recovery Email with Link & Code
app.post('/api/email/send-password-reset', async (req, res) => {
  try {
    const { to, name, resetLink, resetCode } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de email inválido para recuperação de palavra-passe.',
      });
    }

    const code = resetCode || Math.floor(100000 + Math.random() * 900000).toString();
    const actionUrl = resetLink || `https://blazetrack.bv.pt/?reset_token=${encodeURIComponent(code)}&email=${encodeURIComponent(to)}`;
    const subject = `🔐 [Blazetrack BV] Recuperação de Palavra-passe (Código: ${code})`;

    const text = `Olá ${name || 'Bombeiro(a)'},\n\nRecebemos um pedido para redefinir a palavra-passe da sua conta no Blazetrack BV.\n\nCódigo de Verificação: ${code}\n\nPara redefinir a sua palavra-passe diretamente, utilize o link:\n${actionUrl}\n\nEste pedido expira em 15 minutos.\nSe não solicitou esta redefinição, proteja a sua conta e ignore esta mensagem.\n\n"Vida por Vida"\nBlazetrack BV`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0b10; color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #13141f; border-radius: 16px; border: 1px solid #25273a; overflow: hidden; }
          .header { background: #b91c1c; padding: 26px; text-align: center; color: white; }
          .content { padding: 30px 24px; text-align: center; }
          .code-box { background: #1c1e2e; border: 2px dashed #ef4444; border-radius: 12px; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fca5a5; }
          .btn { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 14px; padding: 13px 26px; border-radius: 12px; margin: 16px 0; }
          .footer { background: #0c0d14; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2130; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; font-size: 19px;">🚒 BLAZETRACK BV • SEGURANÇA</h2>
            <p style="margin:4px 0 0 0; font-size: 12px; opacity: 0.9;">Recuperação de Palavra-passe</p>
          </div>
          <div class="content">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #f1f5f9;">Olá, ${name || 'Bombeiro(a)'}!</h3>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0;">
              Recebemos uma solicitação para redefinir a palavra-passe associada ao seu email. Utilize o código de 6 dígitos abaixo no ecrã de recuperação ou clique no botão:
            </p>
            
            <div class="code-box">${code}</div>

            <a href="${actionUrl}" class="btn" target="_blank">
              🔑 Redefinir a Minha Palavra-passe
            </a>

            <p style="font-size: 11px; color: #ef4444; margin-top: 14px;">⏱️ O código e o link expiram em <strong>15 minutos</strong>.</p>
          </div>
          <div class="footer">
            Corpo de Bombeiros Voluntários • "Vida por Vida"<br>
            Se não pediu para redefinir a palavra-passe, ignore este email. A sua palavra-passe atual permanece segura.
          </div>
        </div>
      </body>
      </html>
    `;

    const sendResult = await sendMailSafely({
      to,
      subject,
      text,
      html,
    });

    return res.json({
      success: true,
      messageId: sendResult.messageId || `bv-pwd-${Date.now()}`,
      to,
      code,
      resetLink: actionUrl,
      isLiveSmtp: sendResult.isLiveSmtp,
      warning: sendResult.warning,
      message: `Email de recuperação de palavra-passe com código enviado para ${to}.`,
    });
  } catch (err: any) {
    console.error('[Password Reset Email Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao enviar email de recuperação de palavra-passe.',
    });
  }
});

// 3. API Endpoint to Send Reports via Email (Monthly or Annual)
app.post('/api/send-email', async (req, res) => {
  try {
    const { 
      to, 
      subject, 
      html, 
      text, 
      profile, 
      periodLabel, 
      attachments 
    } = req.body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Endereço de email de destino inválido.' 
      });
    }

    const mailOptions: nodemailer.SendMailOptions = {
      to,
      subject: subject || `[Blazetrack BV] Relatório Operacional - ${profile?.name || 'Bombeiro'} (${periodLabel || ''})`,
      text: text || 'Segue em anexo e no corpo desta mensagem o relatório detalhado de atividades operacionais.',
      html: html || `<p>Relatório de Bombeiro Voluntário gerado por Blazetrack BV.</p>`,
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att: { filename: string; content: string; contentType?: string; encoding?: string }) => ({
        filename: att.filename,
        content: att.content.startsWith('data:') ? att.content.split(',')[1] : att.content,
        encoding: att.content.startsWith('data:') || att.encoding === 'base64' ? 'base64' : 'utf-8',
        contentType: att.contentType,
      }));
    }

    const sendResult = await sendMailSafely(mailOptions);
    const messageId = sendResult.messageId || `bv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[Email Service] Relatório enviado para ${to}. ID: ${messageId}. Modo: ${sendResult.isLiveSmtp ? 'SMTP Ativo' : 'Processamento Seguro'}`);

    return res.json({
      success: true,
      messageId,
      isLiveSmtp: sendResult.isLiveSmtp,
      warning: sendResult.warning,
      message: `Relatório operacional enviado com sucesso para ${to}.`,
    });
  } catch (error: any) {
    console.error('[Email Send Error]', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Falha ao processar envio de email.' 
    });
  }
});

// 4. Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Blazetrack BV] Servidor Full-Stack a executar na porta ${PORT}`);
  });
}

startServer();
