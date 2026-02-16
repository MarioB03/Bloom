import { Timestamp } from 'firebase/firestore';

export type FieldType = 'text' | 'number' | 'slider' | 'select' | 'multiselect' | 'toggle' | 'date';

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: TemplateField[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RegisterEntry {
  id: string;
  userId: string;
  templateId: string;
  templateName: string;
  date: string; // "YYYY-MM-DD"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: Record<string, string | number | boolean | string[]>;
}
