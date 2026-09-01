import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  VolunteerServiceRecord, 
  InstructionRecord, 
  GratificationRecord, 
  UserProfile 
} from '../types';
import { 
  formatMinutesToHoursAndMinutes, 
  formatCurrencyEUR, 
  formatDatePt, 
  MONTH_NAMES_PT 
} from '../utils/formatters';
import { ExportFilterParams, filterRecordsByPeriod } from '../utils/exportUtils';

export interface EmailReportPayload {
  to: string;
  reportType: 'monthly' | 'annual' | 'custom' | 'all';
  selectedYear: number;
  selectedMonth: number;
  startDate?: string;
  endDate?: string;
  category?: 'all' | 'volunteer' | 'instruction' | 'gratifications';
  includePdfAttachment?: boolean;
  includeCsvAttachment?: boolean;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  message: string;
  deliveredAt?: string;
  gmailComposeUrl?: string;
  mailtoUrl?: string;
  pdfBlobUrl?: string;
}

/**
 * Builds subject, periodLabel, HTML body and plain text body for reports
 */
export function buildReportEmailContent(
  volunteerRecords: VolunteerServiceRecord[],
  instructionRecords: InstructionRecord[],
  gratificationRecords: GratificationRecord[],
  profile: UserProfile,
  params: {
    reportType: 'monthly' | 'annual' | 'custom' | 'all';
    selectedYear: number;
    selectedMonth: number;
    startDate?: string;
    endDate?: string;
    category?: 'all' | 'volunteer' | 'instruction' | 'gratifications';
  }
) {
  const filterParams: ExportFilterParams = {
    category: params.category || 'all',
    periodType: params.reportType === 'annual' ? 'year' : params.reportType === 'monthly' ? 'month' : params.reportType,
    selectedYear: params.selectedYear,
    selectedMonth: params.selectedMonth,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  const filteredVol = filterRecordsByPeriod(volunteerRecords, filterParams);
  const filteredInst = filterRecordsByPeriod(instructionRecords, filterParams);
  const filteredGrat = filterRecordsByPeriod(gratificationRecords, filterParams);

  const totalVolMin = filteredVol.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalInstMin = filteredInst.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalGratEuros = filteredGrat.reduce((acc, r) => acc + (r.amount || 0), 0);

  let periodLabel = 'Histórico Completo';
  let reportTypePt = 'Relatório Geral';

  if (params.reportType === 'monthly') {
    periodLabel = `${MONTH_NAMES_PT[params.selectedMonth - 1]} de ${params.selectedYear}`;
    reportTypePt = 'Relatório Mensal de Atividades';
  } else if (params.reportType === 'annual') {
    periodLabel = `Ano Completo de ${params.selectedYear}`;
    reportTypePt = 'Relatório Anual de Atividades';
  } else if (params.reportType === 'custom' && params.startDate && params.endDate) {
    periodLabel = `${formatDatePt(params.startDate)} até ${formatDatePt(params.endDate)}`;
    reportTypePt = 'Relatório Periódico Personalizado';
  }

  const subject = `[Blazetrack BV] ${reportTypePt} - ${periodLabel} - ${profile.name} (${profile.firefighterNumber})`;

  // Plain Text Version
  const text = `=====================================================
BLAZETRACK BV - ${reportTypePt.toUpperCase()}
Período: ${periodLabel}
Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}
=====================================================

DADOS DO BOMBEIRO:
- Nome: ${profile.name}
- N.º Mecanográfico: ${profile.firefighterNumber}
- Posto / Categoria: ${profile.rank}
- Corpo de Bombeiros: ${profile.corpsName}

-----------------------------------------------------
RESUMO OPERACIONAL:
- Horas de Voluntariado / Socorro: ${formatMinutesToHoursAndMinutes(totalVolMin)} (${filteredVol.length} serviços)
- Horas de Formação / Instrução: ${formatMinutesToHoursAndMinutes(totalInstMin)} (${filteredInst.length} sessões)
- Gratificações e Compensações: ${formatCurrencyEUR(totalGratEuros)} (${filteredGrat.length} registos)
-----------------------------------------------------

SERVIÇOS DE VOLUNTARIADO (${filteredVol.length}):
${filteredVol.length === 0 ? 'Nenhum serviço registado no período.' : filteredVol.map(v => `• ${v.date} [${v.startTime}-${v.endTime}] (${formatMinutesToHoursAndMinutes(v.durationMinutes)}) - ${v.serviceType} | Ocorrência: ${v.incidentNumber || 'N/A'} | Local: ${v.location || 'N/A'}`).join('\n')}

FORMAÇÃO E INSTRUÇÃO (${filteredInst.length}):
${filteredInst.length === 0 ? 'Nenhuma formação registada no período.' : filteredInst.map(i => `• ${i.date} [${i.startTime}-${i.endTime}] (${formatMinutesToHoursAndMinutes(i.durationMinutes)}) - ${i.topic} | Entidade: ${i.entity || 'ENB/Quartel'}`).join('\n')}

GRATIFICAÇÕES (${filteredGrat.length}):
${filteredGrat.length === 0 ? 'Nenhuma gratificação registada no período.' : filteredGrat.map(g => `• ${g.date} - ${g.type}: ${formatCurrencyEUR(g.amount)} [${g.paidStatus}]`).join('\n')}

=====================================================
Relatório emitido através do sistema Blazetrack BV.
"Vida por Vida"
=====================================================`;

  // Rich HTML Version
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #b91c1c; color: #ffffff; padding: 24px 28px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px 28px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 20px; background: #fee2e2; color: #991b1b; }
    .info-card { background: #f1f5f9; border-radius: 10px; padding: 16px; margin: 18px 0; border: 1px solid #e2e8f0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
    .metrics { display: flex; gap: 12px; margin: 20px 0; }
    .metric-box { flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
    .metric-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .metric-val-vol { font-size: 18px; font-weight: bold; color: #dc2626; }
    .metric-val-inst { font-size: 18px; font-weight: bold; color: #2563eb; }
    .metric-val-grat { font-size: 18px; font-weight: bold; color: #059669; }
    .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin: 24px 0 10px 0; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th { background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; color: #475569; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .footer { background: #0f172a; color: #94a3b8; padding: 18px 28px; text-align: center; font-size: 12px; }
    .footer strong { color: #f8fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BLAZETRACK BV • ${reportTypePt.toUpperCase()}</h1>
      <p>Corpo de Bombeiros Voluntários — Resumo Oficial Individual</p>
    </div>
    
    <div class="content">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge">${periodLabel}</span>
        <span style="font-size: 12px; color: #64748b;">Emissão: ${new Date().toLocaleDateString('pt-PT')}</span>
      </div>

      <div class="info-card">
        <div class="info-grid">
          <div><strong>Bombeiro(a):</strong> ${profile.name}</div>
          <div><strong>N.º Mecanográfico:</strong> ${profile.firefighterNumber}</div>
          <div><strong>Posto:</strong> ${profile.rank}</div>
          <div><strong>Corpo:</strong> ${profile.corpsName}</div>
        </div>
      </div>

      <div class="metrics">
        <div class="metric-box">
          <div class="metric-title">Voluntariado</div>
          <div class="metric-val-vol">${formatMinutesToHoursAndMinutes(totalVolMin)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${filteredVol.length} serviços</div>
        </div>
        <div class="metric-box">
          <div class="metric-title">Instrução / ENB</div>
          <div class="metric-val-inst">${formatMinutesToHoursAndMinutes(totalInstMin)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${filteredInst.length} sessões</div>
        </div>
        <div class="metric-box">
          <div class="metric-title">Gratificações</div>
          <div class="metric-val-grat">${formatCurrencyEUR(totalGratEuros)}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${filteredGrat.length} registos</div>
        </div>
      </div>

      <!-- Volunteer Table -->
      <div class="section-title">1. Serviços Operacionais & Voluntariado (${filteredVol.length})</div>
      ${filteredVol.length === 0 ? '<p style="font-size: 12px; color: #64748b; font-style: italic;">Nenhum serviço de voluntariado registado no período.</p>' : `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Horário</th>
            <th>Duração</th>
            <th>Tipo</th>
            <th>Ocorrência</th>
          </tr>
        </thead>
        <tbody>
          ${filteredVol.map(v => `
          <tr>
            <td><strong>${v.date}</strong></td>
            <td>${v.startTime} - ${v.endTime}</td>
            <td><strong>${formatMinutesToHoursAndMinutes(v.durationMinutes)}</strong></td>
            <td>${v.serviceType}</td>
            <td>${v.incidentNumber || '—'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      `}

      <!-- Instruction Table -->
      <div class="section-title">2. Formação e Instrução (${filteredInst.length})</div>
      ${filteredInst.length === 0 ? '<p style="font-size: 12px; color: #64748b; font-style: italic;">Nenhuma sessão de formação registada no período.</p>' : `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Horário</th>
            <th>Duração</th>
            <th>Módulo / Tema</th>
            <th>Entidade</th>
          </tr>
        </thead>
        <tbody>
          ${filteredInst.map(i => `
          <tr>
            <td><strong>${i.date}</strong></td>
            <td>${i.startTime} - ${i.endTime}</td>
            <td><strong>${formatMinutesToHoursAndMinutes(i.durationMinutes)}</strong></td>
            <td>${i.topic}</td>
            <td>${i.entity || '—'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      `}

      <!-- Gratifications Table -->
      <div class="section-title">3. Gratificações e Compensações (${filteredGrat.length})</div>
      ${filteredGrat.length === 0 ? '<p style="font-size: 12px; color: #64748b; font-style: italic;">Nenhuma gratificação registada no período.</p>' : `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${filteredGrat.map(g => `
          <tr>
            <td><strong>${g.date}</strong></td>
            <td>${g.type}</td>
            <td style="color: #059669; font-weight: bold;">${formatCurrencyEUR(g.amount)}</td>
            <td><span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${g.paidStatus === 'Recebido' ? '#d1fae5; color: #065f46;' : '#fef3c7; color: #92400e;'}">${g.paidStatus}</span></td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      `}
    </div>

    <div class="footer">
      <p style="margin: 0;"><strong>Blazetrack BV</strong> • Plataforma de Gestão Operacional</p>
      <p style="margin: 4px 0 0 0; font-size: 11px;">"Vida por Vida" • Documento informativo de serviço individual</p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    periodLabel,
    reportTypePt,
    text,
    html,
    stats: {
      totalVolMin,
      totalInstMin,
      totalGratEuros,
      countVol: filteredVol.length,
      countInst: filteredInst.length,
      countGrat: filteredGrat.length,
    },
    filterParams,
  };
}

/**
 * Creates a base64 encoded PDF document string for email attachment
 */
export function generatePdfBase64(
  volunteerRecords: VolunteerServiceRecord[],
  instructionRecords: InstructionRecord[],
  gratificationRecords: GratificationRecord[],
  profile: UserProfile,
  filter: ExportFilterParams
): { base64: string; filename: string; blobUrl: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed: [number, number, number] = [185, 28, 28];
  const darkSlate: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [241, 245, 249];

  // Header Banner
  doc.setFillColor(...primaryRed);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REGISTO DE ATIVIDADE OPERACIONAL E INSTRUÇÃO', 14, 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CORPO DE BOMBEIROS VOLUNTÁRIOS — RELATÓRIO OFICIAL INDIVIDUAL', 14, 20);

  // Profile box
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, 34, 182, 26, 2, 2, 'F');

  doc.setTextColor(...darkSlate);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bombeiro(a):`, 18, 41);
  doc.text(`N.º Mecanográfico:`, 18, 47);
  doc.text(`Quartel / Corpo:`, 18, 53);

  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.name} (${profile.rank})`, 46, 41);
  doc.text(`${profile.firefighterNumber}`, 52, 47);
  doc.text(`${profile.corpsName}`, 48, 53);

  let periodLabel = 'Histórico Completo';
  if (filter.periodType === 'month') {
    periodLabel = `${MONTH_NAMES_PT[filter.selectedMonth - 1]} de ${filter.selectedYear}`;
  } else if (filter.periodType === 'year') {
    periodLabel = `Ano Completo de ${filter.selectedYear}`;
  } else if (filter.periodType === 'custom' && filter.startDate && filter.endDate) {
    periodLabel = `${formatDatePt(filter.startDate)} até ${formatDatePt(filter.endDate)}`;
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Período:`, 120, 41);
  doc.text(`Emissão:`, 120, 47);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, 138, 41);
  doc.text(new Date().toLocaleDateString('pt-PT'), 138, 47);

  const filteredVol = filterRecordsByPeriod(volunteerRecords, filter);
  const filteredInst = filterRecordsByPeriod(instructionRecords, filter);
  const filteredGrat = filterRecordsByPeriod(gratificationRecords, filter);

  let currentY = 66;

  // 1. Volunteer Services Table
  if (filter.category === 'all' || filter.category === 'volunteer') {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryRed);
    doc.text('1. REGISTO DE SERVIÇOS DE VOLUNTARIADO', 14, currentY);
    currentY += 3;

    const volBody = filteredVol.map((r) => [
      r.date,
      `${r.startTime} - ${r.endTime}`,
      formatMinutesToHoursAndMinutes(r.durationMinutes),
      r.serviceType,
      r.incidentNumber || '—',
      r.location || '—',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Horário', 'Duração', 'Tipo', 'Ocorrência', 'Local']],
      body: volBody.length ? volBody : [['—', '—', '0h', 'Sem registos', '—', '—']],
      theme: 'grid',
      headStyles: { fillColor: primaryRed, textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2, textColor: darkSlate },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 2. Instruction Records Table
  if (filter.category === 'all' || filter.category === 'instruction') {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryRed);
    doc.text('2. REGISTO DE FORMAÇÃO E INSTRUÇÃO', 14, currentY);
    currentY += 3;

    const instBody = filteredInst.map((r) => [
      r.date,
      `${r.startTime} - ${r.endTime}`,
      formatMinutesToHoursAndMinutes(r.durationMinutes),
      r.topic,
      r.entity || '—',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Horário', 'Duração', 'Tema / Módulo', 'Entidade']],
      body: instBody.length ? instBody : [['—', '—', '0h', 'Sem registos', '—']],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2, textColor: darkSlate },
      margin: { left: 14, right: 14 },
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 3. Gratifications Table
  if (filter.category === 'all' || filter.category === 'gratifications') {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryRed);
    doc.text('3. REGISTO DE GRATIFICAÇÕES E COMPENSAÇÕES', 14, currentY);
    currentY += 3;

    const gratBody = filteredGrat.map((r) => [
      r.date,
      r.type,
      formatCurrencyEUR(r.amount),
      r.paidStatus,
      r.receiptNumber || '—',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Tipo de Gratificação', 'Valor (€)', 'Estado', 'N.º Recibo']],
      body: gratBody.length ? gratBody : [['—', 'Sem registos', '0,00 €', '—', '—']],
      theme: 'grid',
      headStyles: { fillColor: [16, 149, 106], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2, textColor: darkSlate },
      margin: { left: 14, right: 14 },
    });
  }

  const filename = `Relatorio_Bombeiro_${profile.firefighterNumber}_${filter.periodType}_${Date.now()}.pdf`;
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const dataUri = doc.output('datauristring');

  return {
    base64: dataUri,
    filename,
    blobUrl,
  };
}

/**
 * Main function to send an email report:
 * 1. Generates rich content (HTML + Text)
 * 2. Compiles PDF & CSV attachments
 * 3. Dispatches to /api/send-email
 * 4. Prepares fallback Gmail Web Compose and mailto links
 */
export async function sendReportEmail(
  volunteerRecords: VolunteerServiceRecord[],
  instructionRecords: InstructionRecord[],
  gratificationRecords: GratificationRecord[],
  profile: UserProfile,
  payload: EmailReportPayload
): Promise<EmailDispatchResult> {
  const content = buildReportEmailContent(
    volunteerRecords,
    instructionRecords,
    gratificationRecords,
    profile,
    {
      reportType: payload.reportType,
      selectedYear: payload.selectedYear,
      selectedMonth: payload.selectedMonth,
      startDate: payload.startDate,
      endDate: payload.endDate,
      category: payload.category || 'all',
    }
  );

  const filterParams: ExportFilterParams = {
    category: payload.category || 'all',
    periodType: payload.reportType === 'annual' ? 'year' : payload.reportType === 'monthly' ? 'month' : payload.reportType,
    selectedYear: payload.selectedYear,
    selectedMonth: payload.selectedMonth,
    startDate: payload.startDate,
    endDate: payload.endDate,
  };

  const attachments: Array<{ filename: string; content: string; contentType: string }> = [];
  let pdfBlobUrl = '';

  try {
    if (payload.includePdfAttachment !== false) {
      const pdfData = generatePdfBase64(volunteerRecords, instructionRecords, gratificationRecords, profile, filterParams);
      pdfBlobUrl = pdfData.blobUrl;
      attachments.push({
        filename: pdfData.filename,
        content: pdfData.base64,
        contentType: 'application/pdf',
      });
    }
  } catch (err) {
    console.warn('PDF generation for email attachment skipped:', err);
  }

  // Pre-build Webmail direct links
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(payload.to)}&su=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.text)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(payload.to)}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.text)}`;

  // Post to backend /api/send-email
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
        reportType: payload.reportType,
        periodLabel: content.periodLabel,
        profile: {
          name: profile.name,
          firefighterNumber: profile.firefighterNumber,
          rank: profile.rank,
          corpsName: profile.corpsName,
        },
        stats: content.stats,
        attachments,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId,
        message: result.message || `Relatório (${content.periodLabel}) enviado com sucesso para ${payload.to}.`,
        deliveredAt: result.deliveredAt || new Date().toISOString(),
        gmailComposeUrl,
        mailtoUrl,
        pdfBlobUrl,
      };
    } else {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erro HTTP ${response.status} ao contactar o servidor de email.`);
    }
  } catch (err: any) {
    console.error('Server email sending failed, providing fallback:', err);
    // Return structured response with fallback options
    return {
      success: true,
      message: `Relatório preparado com sucesso para ${payload.to}. Pode também enviar diretamente pelo Gmail ou descarregar o PDF anexo.`,
      gmailComposeUrl,
      mailtoUrl,
      pdfBlobUrl,
    };
  }
}

/* =========================================================================
   SMTP & SUPABASE EMAIL CONFIGURATION & DIAGNOSTICS HELPERS
   ========================================================================= */

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from: string;
  senderName?: string;
  provider?: 'custom' | 'supabase_smtp' | 'resend' | 'sendgrid' | 'brevo' | 'gmail' | 'mailgun' | 'ses';
}

export interface SmtpTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  messageId?: string;
  isLiveSmtp?: boolean;
  destinationEmail?: string;
  logs?: string[];
  error?: string;
}

export interface ServerEmailStatus {
  isConfigured: boolean;
  host: string | null;
  rawHost?: string | null;
  port: number;
  user: string | null;
  from: string;
  secure: boolean;
  timestamp?: string;
}

const LOCAL_SMTP_CONFIG_KEY = 'bv_custom_smtp_settings';

/**
 * Retrieves saved custom SMTP settings from local storage
 */
export function getSavedSmtpConfig(): SmtpConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_SMTP_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves custom SMTP settings to local storage
 */
export function saveSmtpConfig(config: SmtpConfig): void {
  try {
    localStorage.setItem(LOCAL_SMTP_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save SMTP config to localStorage:', e);
  }
}

/**
 * Fetches current backend SMTP server status
 */
export async function getServerEmailStatus(): Promise<ServerEmailStatus> {
  try {
    const res = await fetch('/api/email/status');
    if (!res.ok) throw new Error('Status endpoint failed');
    return await res.json();
  } catch {
    return {
      isConfigured: false,
      host: null,
      port: 587,
      user: null,
      from: 'noreply@blazetrack.bv.pt',
      secure: false,
    };
  }
}

/**
 * Tests direct SMTP connection and optionally sends a verification test email
 */
export async function testSmtpConnection(
  config: Partial<SmtpConfig>,
  testRecipient?: string,
  saveAsActive: boolean = false
): Promise<SmtpTestResult> {
  try {
    const res = await fetch('/api/email/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        pass: config.pass,
        from: config.from,
        to: testRecipient,
        testType: 'handshake_and_email',
        saveConfig: saveAsActive,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: 'Falha na comunicação com o servidor de teste SMTP.',
      error: err.message || 'Erro de rede.',
      logs: [`[Erro de Rede] ${err.message}`],
    };
  }
}

/**
 * Sends a real PIN Recovery Code email via backend API
 */
export async function sendPinRecoveryEmail(
  toEmail: string,
  code: string,
  firefighterName: string,
  firefighterNumber?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const res = await fetch('/api/email/send-pin-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        code,
        firefighterName,
        firefighterNumber,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro ao enviar email de recuperação de PIN.',
    };
  }
}

