/**
 * =========================================================================
 * BLAZETRACK BV - INTEGRAÇÃO DE FORMULÁRIO COM RESEND VIA GOOGLE APPS SCRIPT
 * =========================================================================
 * 
 * Este ficheiro Google Apps Script (.gs) recebe os dados do formulário
 * (via Web App doPost ou via Trigger onFormSubmit do Google Forms)
 * e envia o e-mail através da API oficial do Resend usando UrlFetchApp.
 * 
 * Configurações pré-definidas:
 * - Remetente: Geral <geral@appblazetrack.com>
 * - Destinatário: jagamaal@gmail.com
 */

// 1. Chave de API do Resend (Cole a sua chave que começa por re_...)
var RESEND_API_KEY = "SUA_API_KEY_DO_RESEND_AQUI";

// 2. Configuração de e-mail padrão
var EMAIL_FROM = "Geral <geral@appblazetrack.com>"; // O seu domínio verificado na Spaceship/Resend
var EMAIL_TO = ["jagamaal@gmail.com"];              // Onde quer receber a mensagem

/**
 * Função principal para envio de e-mail via API do Resend usando UrlFetchApp
 * 
 * @param {string} nome - Nome do remetente/contacto
 * @param {string} emailUtilizador - E-mail de quem preencheu o formulário
 * @param {string} mensagem - Conteúdo da mensagem
 * @param {string} [assuntoPersonalizado] - Assunto opcional do e-mail
 * @param {string} [apiKeyPersonalizada] - Chave opcional de substituição
 * @returns {boolean} true se enviado com sucesso, false caso contrário
 */
function enviarEmailPeloResend(nome, emailUtilizador, mensagem, assuntoPersonalizado, apiKeyPersonalizada) {
  var apiKey = apiKeyPersonalizada || RESEND_API_KEY;
  var url = "https://api.resend.com/emails";
  
  var nomeLimpo = nome ? nome.toString().trim() : "Contacto Web";
  var emailLimpo = emailUtilizador ? emailUtilizador.toString().trim() : "Não especificado";
  var mensagemLimpa = mensagem ? mensagem.toString().trim() : "(Mensagem vazia)";
  var assunto = assuntoPersonalizado || ("Novo contacto de " + nomeLimpo);
  
  // Estrutura HTML do e-mail
  var corpoHtml = 
    "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #12131a; color: #f1f5f9; border-radius: 12px; border: 1px solid #282a3c; overflow: hidden;'>" +
      "<div style='background: #dc2626; padding: 20px; text-align: center; color: white;'>" +
        "<h2 style='margin: 0; font-size: 20px;'>🚒 BLAZETRACK • NOVO CONTACTO DE FORMULÁRIO</h2>" +
      "</div>" +
      "<div style='padding: 24px; font-size: 14px; line-height: 1.6; color: #e2e8f0;'>" +
        "<p style='margin: 0 0 12px 0;'><strong style='color: #f87171;'>Nome:</strong> " + escapeHtml(nomeLimpo) + "</p>" +
        "<p style='margin: 0 0 12px 0;'><strong style='color: #f87171;'>Email:</strong> <a href='mailto:" + escapeHtml(emailLimpo) + "' style='color: #60a5fa; text-decoration: none;'>" + escapeHtml(emailLimpo) + "</a></p>" +
        "<div style='margin-top: 16px; padding: 16px; background: #1c1e2b; border-radius: 8px; border-left: 4px solid #ef4444;'>" +
          "<strong style='display: block; margin-bottom: 6px; color: #cbd5e1;'>Mensagem:</strong>" +
          "<p style='margin: 0; white-space: pre-wrap; color: #f8fafc;'>" + escapeHtml(mensagemLimpa) + "</p>" +
        "</div>" +
        "<p style='font-size: 11px; color: #94a3b8; margin-top: 24px;'>Enviado em " + new Date().toLocaleString('pt-PT') + " através de Blazetrack & Resend API.</p>" +
      "</div>" +
      "<div style='background: #0d0e15; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #202230;'>" +
        "Blazetrack BV • \"Vida por Vida\"" +
      "</div>" +
    "</div>";

  var payload = {
    "from": EMAIL_FROM,
    "to": EMAIL_TO,
    "subject": assunto,
    "html": corpoHtml,
    "text": "Novo contacto de: " + nomeLimpo + "\nEmail: " + emailLimpo + "\n\nMensagem:\n" + mensagemLimpa
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + apiKey
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var resultado = JSON.parse(response.getContentText());
    
    if (code >= 200 && code < 300) {
      Logger.log("E-mail enviado com sucesso: " + JSON.stringify(resultado));
      return true;
    } else {
      Logger.log("Erro da API do Resend (HTTP " + code + "): " + JSON.stringify(resultado));
      return false;
    }
  } catch (error) {
    Logger.log("Erro ao enviar e-mail: " + error.toString());
    return false;
  }
}

/**
 * Endpoint HTTP POST para receber dados de formulários Web (AJAX / Fetch / HTML Form)
 * 
 * Permite receber dados em formato JSON ou Form URL Encoded.
 * Exemplo de corpo JSON:
 * {
 *   "nome": "João Silva",
 *   "emailUtilizador": "joao@exemplo.com",
 *   "mensagem": "Gostaria de obter informações sobre a aplicação.",
 *   "assunto": "Dúvida sobre o Blazetrack"
 * }
 */
function doPost(e) {
  try {
    var data = {};

    // 1. Tentar ler JSON se enviado no corpo (Content-Type: application/json)
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      // 2. Ler campos de formulário padrão (application/x-www-form-urlencoded)
      data = e.parameter;
    }

    // Extrair campos de forma flexível
    var nome = data.nome || data.name || data.Nome || "Visitante";
    var emailUtilizador = data.emailUtilizador || data.email || data.userEmail || data.Email || "Não fornecido";
    var mensagem = data.mensagem || data.message || data.Mensagem || "";
    var assunto = data.assunto || data.subject || ("Novo contacto de " + nome);
    var apiKeyCustom = data.apiKey || data.resendApiKey || "";

    // Chamar a função de envio pelo Resend
    var sucesso = enviarEmailPeloResend(nome, emailUtilizador, mensagem, assunto, apiKeyCustom);

    var resposta = {
      status: sucesso ? "success" : "error",
      message: sucesso ? "Mensagem enviada com sucesso!" : "Falha ao enviar através do Resend. Verifique a API Key e o remetente.",
      data: {
        nome: nome,
        email: emailUtilizador,
        timestamp: new Date().toISOString()
      }
    };

    return ContentService
      .createTextOutput(JSON.stringify(resposta))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Erro no doPost: " + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Erro interno: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint HTTP GET para testar se a Web App do Google Apps Script está online
 */
function doGet(e) {
  var html = 
    "<!DOCTYPE html><html><head><title>Blazetrack Resend Webhook</title></head>" +
    "<body style='font-family: sans-serif; padding: 30px; background: #0c0d14; color: #fff; text-align: center;'>" +
      "<h1 style='color: #ef4444;'>🚒 Blazetrack Google Apps Script Webhook</h1>" +
      "<p style='color: #94a3b8;'>O webhook do Google Apps Script está ativo e pronto a receber submissões POST do formulário para envio via Resend.</p>" +
      "<p style='color: #10b981;'><strong>Status:</strong> Online (200 OK)</p>" +
    "</body></html>";
    
  return HtmlService.createHtmlOutput(html);
}

/**
 * Trigger automático para Formulários Google (Google Forms) ligados a Google Sheets
 * 
 * Para ativar:
 * 1. No Google Sheets ligado ao Google Form, clique em Extensões > Apps Script.
 * 2. Cole este código.
 * 3. Clique em Acionadores (ícone de despertador) > Adicionar Acionador.
 * 4. Selecione a função `onFormSubmit` e o evento "Ao enviar formulário".
 */
function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    Logger.log("Evento onFormSubmit sem dados namedValues.");
    return;
  }

  var responses = e.namedValues;
  
  // Procura dinâmica pelos nomes das perguntas comuns
  var nome = getFirstValue(responses, ["Nome", "Nome Completo", "Nome do Bombeiro", "Name"]) || "Utilizador";
  var emailUtilizador = getFirstValue(responses, ["Email", "E-mail", "Email do Utilizador", "Endereço de e-mail"]) || "";
  var mensagem = getFirstValue(responses, ["Mensagem", "Descrição", "Observações", "Texto", "Comentários"]) || "";
  var assunto = getFirstValue(responses, ["Assunto", "Motivo", "Tipo de Contacto"]) || ("Contacto de Formulário Google: " + nome);

  enviarEmailPeloResend(nome, emailUtilizador, mensagem, assunto);
}

// Utilitário para ler a primeira resposta válida de um array de perguntas
function getFirstValue(namedValues, possibleKeys) {
  for (var i = 0; i < possibleKeys.length; i++) {
    var key = possibleKeys[i];
    if (namedValues[key] && namedValues[key].length > 0 && namedValues[key][0]) {
      return namedValues[key][0];
    }
  }
  return "";
}

// Utilitário para escapar HTML contra injeções
function escapeHtml(text) {
  if (!text) return "";
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Função de teste manual no editor do Google Apps Script
 */
function testarEnvioManual() {
  var sucesso = enviarEmailPeloResend(
    "Gonçalo Teste",
    "bombeiro.teste@gmail.com",
    "Esta é uma mensagem de teste enviada diretamente do Google Apps Script usando UrlFetchApp e Resend."
  );
  Logger.log("Resultado do teste: " + (sucesso ? "SUCESSO" : "FALHA"));
}
