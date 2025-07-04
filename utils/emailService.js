/**
 * Serviço de envio de emails
 * Responsável por enviar notificações por email
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configurações padrão (substituir por configurações reais em produção)
const config = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  },
  from: process.env.EMAIL_FROM || 'Sistema Financeiro <financeiro@example.com>'
};

/**
 * Cria um transportador de email baseado nas configurações
 * Em ambiente de desenvolvimento, pode ser configurado para usar Ethereal
 */
async function createTransporter() {
  // Verificar se estamos em modo de teste/desenvolvimento
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Criar uma conta de teste no Ethereal para desenvolvimento
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      logger.debug('Conta de email de teste criada', { 
        user: testAccount.user, 
        url: 'https://ethereal.email' 
      });
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
    } catch (error) {
      logger.error('Erro ao criar conta de email de teste', { error });
      // Fallback para as configurações padrão
    }
  }
  
  // Usar configurações padrão
  return nodemailer.createTransport(config);
}

/**
 * Envia um email
 * @param {Object} options - Opções do email
 * @param {string} options.to - Destinatário(s)
 * @param {string} options.subject - Assunto
 * @param {string} options.text - Conteúdo em texto puro
 * @param {string} options.html - Conteúdo em HTML (opcional)
 * @returns {Promise} - Promise com resultado do envio
 */
async function sendEmail(options) {
  try {
    // Criar transportador
    const transporter = await createTransporter();
    
    // Configurações da mensagem
    const mailOptions = {
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || ''
    };
    
    logger.info(`Enviando email para ${options.to}`, { subject: options.subject });
    
    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    // Se estiver usando Ethereal, mostrar URL para visualizar o email
    if (info.messageId && info.previewURL) {
      logger.info('Email de teste enviado', { 
        messageId: info.messageId, 
        previewURL: nodemailer.getTestMessageUrl(info) || info.previewURL 
      });
    }
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    logger.error('Erro ao enviar email', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação de vencimentos próximos
 * @param {Object} usuario - Dados do usuário
 * @param {Array} vencimentos - Lista de movimentações com vencimento próximo
 */
async function enviarNotificacaoVencimentos(usuario, vencimentos) {
  if (!vencimentos || vencimentos.length === 0) return;
  
  const assunto = `[Sistema Financeiro] Você tem ${vencimentos.length} vencimentos próximos`;
  
  let textoPlano = `Olá ${usuario.nome},\n\n`;
  textoPlano += `Você tem ${vencimentos.length} pagamentos com vencimento nos próximos dias:\n\n`;
  
  vencimentos.forEach(v => {
    textoPlano += `- ${v.descricao}: R$ ${v.valor} (vence em ${v.data_vencimento})\n`;
  });
  
  textoPlano += `\nAcesse o sistema para gerenciar seus pagamentos.\n\nAtenciosamente,\nSistema de Controle Financeiro`;
  
  // Versão HTML
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Olá ${usuario.nome},</h2>
      <p>Você tem <strong>${vencimentos.length} pagamentos</strong> com vencimento nos próximos dias:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #3498db; color: white;">
          <th style="padding: 10px; text-align: left;">Descrição</th>
          <th style="padding: 10px; text-align: right;">Valor</th>
          <th style="padding: 10px; text-align: center;">Vencimento</th>
        </tr>
  `;
  
  vencimentos.forEach((v, index) => {
    const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
    htmlContent += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 10px; text-align: left;">${v.descricao}</td>
        <td style="padding: 10px; text-align: right; color: #e74c3c;">R$ ${v.valor}</td>
        <td style="padding: 10px; text-align: center;">${v.data_vencimento}</td>
      </tr>
    `;
  });
  
  htmlContent += `
      </table>
      
      <p>Acesse o sistema para gerenciar seus pagamentos.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p>Atenciosamente,<br>Sistema de Controle Financeiro</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: usuario.email,
    subject: assunto,
    text: textoPlano,
    html: htmlContent
  });
}

// Exportar funções
module.exports = {
  sendEmail,
  enviarNotificacaoVencimentos
};
