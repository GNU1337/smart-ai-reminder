export interface NotificationItem {
  id: string;
  app: string; // e.g., 'Anna', 'Messenger', 'Kalender', 'SMS', 'E-post', 'System'
  title: string;
  content: string;
  timestamp: string;
  isPriority?: boolean;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'website' | 'newsletter';
  description?: string;
}

export interface MemoItem {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
  alarmTime?: string; // e.g. "14:30"
  lastAlarmTriggeredDate?: string; // e.g. "2026-05-25"
}

export interface BriefingResult {
  briefing: string;
  generatedAt: string;
  type: 'morning' | 'evening' | 'quick' | 'weekly';
}
