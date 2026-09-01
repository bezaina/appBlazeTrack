import { VolunteerServiceRecord, InstructionRecord, GratificationRecord, UserProfile, ActiveShiftTimer, CalendarTask } from '../types';
import { initialUserProfile, initialVolunteerRecords, initialInstructionRecords, initialGratificationRecords, initialCalendarTasks, DEFAULT_GRATIFICATION_RATES } from './mockData';

const STORAGE_KEYS = {
  PROFILE: 'bv_profile_v1',
  VOLUNTEER: 'bv_volunteer_records_v1',
  INSTRUCTION: 'bv_instruction_records_v1',
  GRATIFICATIONS: 'bv_gratification_records_v1',
  CALENDAR_TASKS: 'bv_calendar_tasks_v1',
  ACTIVE_SHIFT: 'bv_active_shift_v1',
  PIN_LOCKED: 'bv_pin_locked_state',
};

export function loadProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure default rates if missing
      if (!parsed.gratificationRates) {
        parsed.gratificationRates = DEFAULT_GRATIFICATION_RATES;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading profile', e);
  }
  return initialUserProfile;
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

export function loadCalendarTasks(): CalendarTask[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR_TASKS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading calendar tasks', e);
  }
  return initialCalendarTasks;
}

export function saveCalendarTasks(tasks: CalendarTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving calendar tasks', e);
  }
}

export function loadVolunteerRecords(): VolunteerServiceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VOLUNTEER);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading volunteer records', e);
  }
  return initialVolunteerRecords;
}

export function saveVolunteerRecords(records: VolunteerServiceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUNTEER, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving volunteer records', e);
  }
}

export function loadInstructionRecords(): InstructionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INSTRUCTION);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading instruction records', e);
  }
  return initialInstructionRecords;
}

export function saveInstructionRecords(records: InstructionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INSTRUCTION, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving instruction records', e);
  }
}

export function loadGratificationRecords(): GratificationRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRATIFICATIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading gratification records', e);
  }
  return initialGratificationRecords;
}

export function saveGratificationRecords(records: GratificationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRATIFICATIONS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving gratification records', e);
  }
}

export function loadActiveShift(): ActiveShiftTimer {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading active shift', e);
  }
  return {
    isRunning: false,
    startTime: null,
    serviceType: 'Piquete/Socorro',
  };
}

export function saveActiveShift(shift: ActiveShiftTimer): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
  } catch (e) {
    console.error('Error saving active shift', e);
  }
}

