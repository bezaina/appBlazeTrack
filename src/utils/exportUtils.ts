import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VolunteerServiceRecord, InstructionRecord, GratificationRecord, UserProfile } from '../types';
import { formatMinutesToHoursAndMinutes, formatCurrencyEUR, formatDatePt, MONTH_NAMES_PT } from './formatters';

export interface ExportFilterParams {
  category: 'all' | 'volunteer' | 'instruction' | 'gratifications';
  periodType: 'month' | 'year' | 'all' | 'custom';
  selectedYear: number;
  selectedMonth: number; // 1-12
  startDate?: string;
  endDate?: string;
}

export function filterRecordsByPeriod<T extends { date: string }>(
  records: T[],
  params: { periodType: 'month' | 'year' | 'all' | 'custom'; selectedYear: number; selectedMonth: number; startDate?: string; endDate?: string }
): T[] {
  return records.filter((rec) => {
    if (!rec.date) return false;
    const [yStr, mStr] = rec.date.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);

    if (params.periodType === 'month') {
      return year === params.selectedYear && month === params.selectedMonth;
    }
    if (params.periodType === 'year') {
      return year === params.selectedYear;
    }
    if (params.periodType === 'custom' && params.startDate && params.endDate) {
      return rec.date >= params.startDate && rec.date <= params.endDate;
    }
    return true;
  });
}

/**
 * Generate an official PDF report (Relatório de Atividade / Folha de Serviço)
 */
export function generatePdfReport(
  volunteerRecords: VolunteerServiceRecord[],
  instructionRecords: InstructionRecord[],
  gratificationRecords: GratificationRecord[],
  profile: UserProfile,
  filter: ExportFilterParams
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryRed: [number, number, number] = [185, 28, 28]; // #b91c1c
  const darkSlate: [number, number, number] = [30, 41, 59]; // #1e293b
  const lightGray: [number, number, number] = [241, 245, 249]; // #f1f5f9

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

  // Profile and metadata box
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

  // Period info on the right
  let periodLabel = 'Histórico Completo';
  if (filter.periodType === 'month') {
    periodLabel = `${MONTH_NAMES_PT[filter.selectedMonth - 1]} de ${filter.selectedYear}`;
  } else if (filter.periodType === 'year') {
    periodLabel = `Ano Completo de ${filter.selectedYear}`;
  } else if (filter.periodType === 'custom' && filter.startDate && filter.endDate) {
    periodLabel = `${formatDatePt(filter.startDate)} até ${formatDatePt(filter.endDate)}`;
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Período do Relatório:`, 120, 41);
  doc.text(`Data de Emissão:`, 120, 47);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, 156, 41);
  doc.text(new Date().toLocaleDateString('pt-PT'), 150, 47);

  let currentY = 66;

  // Filter lists
  const filteredVol = filterRecordsByPeriod(volunteerRecords, filter);
  const filteredInst = filterRecordsByPeriod(instructionRecords, filter);
  const filteredGrat = filterRecordsByPeriod(gratificationRecords, filter);

  const totalVolMin = filteredVol.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalInstMin = filteredInst.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalGratEuros = filteredGrat.reduce((acc, r) => acc + (r.amount || 0), 0);

  // Summary Metrics Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, 182, 16, 'DF');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`TOTAL HORAS VOLUNTARIADO: ${formatMinutesToHoursAndMinutes(totalVolMin)}`, 18, currentY + 7);
  doc.text(`TOTAL HORAS INSTRUÇÃO: ${formatMinutesToHoursAndMinutes(totalInstMin)}`, 18, currentY + 12);

  if (filter.category === 'all' || filter.category === 'gratifications') {
    doc.setTextColor(...primaryRed);
    doc.text(`TOTAL GRATIFICAÇÕES: ${formatCurrencyEUR(totalGratEuros)}`, 115, currentY + 10);
  }

  currentY += 22;

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
      r.incidentNumber || r.vehicle || '—',
      r.location || '—',
      r.notes || '—',
    ]);

    if (volBody.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum serviço de voluntariado registado no período selecionado.', 14, currentY + 5);
      currentY += 12;
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Horário', 'Duração', 'Tipo de Serviço', 'Ocorr./Viat.', 'Local', 'Observações']],
        body: volBody,
        theme: 'grid',
        headStyles: {
          fillColor: primaryRed,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: darkSlate,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 22 },
          2: { cellWidth: 20, fontStyle: 'bold' },
          3: { cellWidth: 32 },
          4: { cellWidth: 24 },
          5: { cellWidth: 26 },
          6: { cellWidth: 38 },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 10;
    }
  }

  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 2. Instruction Records Table
  if (filter.category === 'all' || filter.category === 'instruction') {
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
      r.instructor || '—',
      r.entity || '—',
      r.certificateRef || '—',
    ]);

    if (instBody.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhuma sessão de instrução registada no período selecionado.', 14, currentY + 5);
      currentY += 12;
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Horário', 'Duração', 'Tema / Módulo da Instrução', 'Formador', 'Entidade', 'Certificado']],
        body: instBody,
        theme: 'grid',
        headStyles: {
          fillColor: [51, 65, 85], // Slate 700 to distinguish visually
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: darkSlate,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 22 },
          2: { cellWidth: 20, fontStyle: 'bold' },
          3: { cellWidth: 42 },
          4: { cellWidth: 28 },
          5: { cellWidth: 26 },
          6: { cellWidth: 24 },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 10;
    }
  }

  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 3. Gratifications Records Table
  if (filter.category === 'all' || filter.category === 'gratifications') {
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
      r.notes || '—',
    ]);

    if (gratBody.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhuma gratificação registada no período selecionado.', 14, currentY + 5);
      currentY += 12;
    } else {
      autoTable(doc, {
        startY: currentY,
        head: [['Data', 'Tipo de Gratificação / Compensação', 'Valor (€)', 'Estado', 'N.º Recibo / Folha', 'Observações']],
        body: gratBody,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 149, 106], // Green for financial
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: darkSlate,
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 50 },
          2: { cellWidth: 26, fontStyle: 'bold' },
          3: { cellWidth: 22 },
          4: { cellWidth: 28 },
          5: { cellWidth: 34 },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-expect-error autoTable adds lastAutoTable to doc
      currentY = doc.lastAutoTable.finalY + 15;
    }
  }

  const cleanFileName = `Relatorio_Bombeiro_${profile.firefighterNumber}_${filter.periodType}_${Date.now()}.pdf`;
  doc.save(cleanFileName);
}

/**
 * Generate CSV file export for spreadsheet applications
 */
export function exportCsvReport(
  volunteerRecords: VolunteerServiceRecord[],
  instructionRecords: InstructionRecord[],
  gratificationRecords: GratificationRecord[],
  profile: UserProfile,
  filter: ExportFilterParams
) {
  const filteredVol = filterRecordsByPeriod(volunteerRecords, filter);
  const filteredInst = filterRecordsByPeriod(instructionRecords, filter);
  const filteredGrat = filterRecordsByPeriod(gratificationRecords, filter);

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  // Profile Header
  csvContent += `"RELATÓRIO DE ATIVIDADE DO BOMBEIRO VOLUNTÁRIO"\n`;
  csvContent += `"Bombeiro:","${profile.name}","N.º Mec:","${profile.firefighterNumber}","Posto:","${profile.rank}","Corpo:","${profile.corpsName}"\n\n`;

  // 1. Volunteer Services
  if (filter.category === 'all' || filter.category === 'volunteer') {
    csvContent += `"--- HORAS DE VOLUNTARIADO E SERVIÇO OPERACIONAL ---"\n`;
    csvContent += `"ID","Data","Hora Início","Hora Fim","Duração (Minutos)","Duração Formatada","Tipo de Serviço","N.º Ocorrência","Viatura","Local","Observações"\n`;

    filteredVol.forEach((r) => {
      csvContent += `"${r.id}","${r.date}","${r.startTime}","${r.endTime}","${r.durationMinutes}","${formatMinutesToHoursAndMinutes(r.durationMinutes)}","${r.serviceType}","${r.incidentNumber || ''}","${r.vehicle || ''}","${r.location || ''}","${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;
  }

  // 2. Instruction Sessions
  if (filter.category === 'all' || filter.category === 'instruction') {
    csvContent += `"--- HORAS DE FORMAÇÃO E INSTRUÇÃO ---"\n`;
    csvContent += `"ID","Data","Hora Início","Hora Fim","Duração (Minutos)","Duração Formatada","Tema / Módulo","Formador","Entidade","Local","Certificado / Ref","Observações"\n`;

    filteredInst.forEach((r) => {
      csvContent += `"${r.id}","${r.date}","${r.startTime}","${r.endTime}","${r.durationMinutes}","${formatMinutesToHoursAndMinutes(r.durationMinutes)}","${r.topic}","${r.instructor || ''}","${r.entity || ''}","${r.location || ''}","${r.certificateRef || ''}","${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;
  }

  // 3. Gratifications
  if (filter.category === 'all' || filter.category === 'gratifications') {
    csvContent += `"--- GRATIFICAÇÕES E COMPENSAÇÕES ---"\n`;
    csvContent += `"ID","Data","Tipo de Gratificação","Valor (€)","Estado","Data de Pagamento","N.º Recibo / Folha","Observações"\n`;

    filteredGrat.forEach((r) => {
      csvContent += `"${r.id}","${r.date}","${r.type}","${r.amount.toFixed(2)}","${r.paidStatus}","${r.paymentDate || ''}","${r.receiptNumber || ''}","${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Registo_Bombeiro_${profile.firefighterNumber}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Backup state as JSON file
 */
export function downloadJsonBackup(data: {
  volunteerRecords: VolunteerServiceRecord[];
  instructionRecords: InstructionRecord[];
  gratificationRecords: GratificationRecord[];
  profile: UserProfile;
}) {
  const jsonStr = JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    ...data,
  }, null, 2);

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Backup_Bombeiro_${data.profile.firefighterNumber}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
