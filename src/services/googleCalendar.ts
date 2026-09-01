import { getGoogleAccessToken } from './googleAuth';
import { CalendarTask, VolunteerServiceRecord, InstructionRecord } from '../types';

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
}

/**
 * Creates an event in the user's primary Google Calendar
 */
export const createGoogleCalendarEvent = async (
  event: GoogleCalendarEventInput
): Promise<{ id: string; htmlLink?: string }> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Não há token Google ativo. Por favor inicia sessão com a tua conta Google.');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDateTime,
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'Europe/Lisbon',
      },
      reminders: {
        useDefault: true,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Falha ao criar evento no Google Calendar (${response.status})`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    htmlLink: data.htmlLink,
  };
};

/**
 * Syncs a CalendarTask to Google Calendar
 */
export const syncTaskToGoogleCalendar = async (task: CalendarTask): Promise<string> => {
  const time = task.time || '08:00';
  const startDateTime = `${task.date}T${time}:00`;
  
  // Calculate end time (e.g. +2 hours if not specified)
  const [hours, mins] = time.split(':').map(Number);
  const endHours = String(Math.min(23, (hours || 8) + 2)).padStart(2, '0');
  const endDateTime = `${task.date}T${endHours}:${String(mins || 0).padStart(2, '0')}:00`;

  const result = await createGoogleCalendarEvent({
    summary: `[BLAZETRACK] ${task.title}`,
    description: `Tipo: ${task.type}\nPrioridade: ${task.priority}\nNotas: ${task.notes || 'Sem observações'}`,
    location: task.location || 'Corpo de Bombeiros',
    startDateTime,
    endDateTime,
  });

  return result.id;
};

/**
 * Syncs a Volunteer Service Record to Google Calendar
 */
export const syncVolunteerRecordToGoogleCalendar = async (
  record: VolunteerServiceRecord
): Promise<string> => {
  const startDateTime = `${record.date}T${record.startTime}:00`;
  const endDateTime = `${record.date}T${record.endTime}:00`;

  const result = await createGoogleCalendarEvent({
    summary: `🚒 [Serviço BV] ${record.serviceType}`,
    description: `Número de Ocorrência: ${record.incidentNumber || 'N/A'}\nViatura: ${record.vehicle || 'N/A'}\nNotas: ${record.notes || 'Sem observações'}\nDuração: ${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m`,
    location: record.location || 'Corpo de Bombeiros',
    startDateTime,
    endDateTime,
  });

  return result.id;
};

/**
 * Syncs an Instruction Record to Google Calendar
 */
export const syncInstructionRecordToGoogleCalendar = async (
  record: InstructionRecord
): Promise<string> => {
  const startDateTime = `${record.date}T${record.startTime}:00`;
  const endDateTime = `${record.date}T${record.endTime}:00`;

  const result = await createGoogleCalendarEvent({
    summary: `🎓 [Instrução BV] ${record.topic}`,
    description: `Entidade: ${record.entity || 'Corpo de Bombeiros'}\nFormador: ${record.instructor || 'N/A'}\nNotas: ${record.notes || 'Sem observações'}\nDuração: ${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m`,
    location: record.location || 'Sala de Formação / Parque de Manobras',
    startDateTime,
    endDateTime,
  });

  return result.id;
};
