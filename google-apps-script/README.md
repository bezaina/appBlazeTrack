# Integração do Formulário BlazeTrack com Resend & Google Apps Script

Este módulo contém a implementação da função `enviarEmailPeloResend` usando `UrlFetchApp` no Google Apps Script, já configurada para receber dados de formulários web (via Web App `doPost`) ou respostas de Google Forms (`onFormSubmit`).

## 📁 Ficheiros
- `Codigo.gs`: Código principal para colar no editor do Google Apps Script (`script.google.com`).

---

## ⚙️ Configuração Pré-definida
- **Remetente:** `Geral <geral@appblazetrack.com>` (Domínio configurado na Spaceship / Resend)
- **Destinatário:** `jagamaal@gmail.com`
- **Endpoint da API:** `https://api.resend.com/emails`

---

## 🚀 Como Utilizar no Google Apps Script

### Opção A: Como Web App (Para formulários Web e chamadas AJAX/Fetch)
1. Aceda a [script.google.com](https://script.google.com) e crie um **Novo Projeto**.
2. Substitua o código existente pelo conteúdo de `Codigo.gs`.
3. Substitua `"SUA_API_KEY_DO_RESEND_AQUI"` pela sua chave de API do Resend (que começa por `re_...`).
4. Clique em **Implementar (Deploy) > Nova implementação (New Deployment)**.
5. Selecione o tipo **Aplicação Web (Web app)**:
   - **Executar como:** Eu (o seu e-mail do Google)
   - **Quem tem acesso:** Qualquer pessoa (Anyone)
6. Clique em **Implementar** e copie o **URL da Aplicação Web**.
7. Pode agora fazer requisições POST para esse URL a partir de qualquer formulário com o JSON:
```json
{
  "nome": "Nome do Utilizador",
  "emailUtilizador": "email@exemplo.com",
  "mensagem": "Texto da mensagem..."
}
```

---

### Opção B: Com Google Forms & Google Sheets
1. No seu Google Sheets ligado ao formulário, clique em **Extensões > Apps Script**.
2. Cole o código do `Codigo.gs` e coloque a sua API Key do Resend.
3. No menu à esquerda, clique em **Acionadores (ícone do despertador) > Adicionar Acionador**.
4. Configure:
   - Função: `onFormSubmit`
   - Origem do evento: `Da folha de cálculo`
   - Tipo de evento: `Ao enviar formulário`
5. Guarde e autorize as permissões da conta Google.
