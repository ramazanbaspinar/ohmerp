import api from './api';

export interface CodeTemplateDto {
  id: string;
  documentType: number;
  prefix: string;
  suffix: string | null;
  padding: number;
  useDate: boolean;
  dateFormat: string | null;
  isActive: boolean;
  isManualEntryAllowed: boolean;
  currentNumber: number;
}

export interface UpdateCodeTemplateRequest {
  prefix: string;
  suffix: string | null;
  padding: number;
  useDate: boolean;
  dateFormat: string | null;
  isActive: boolean;
  isManualEntryAllowed: boolean;
  currentNumber: number;
}

export const codeTemplateService = {
  getAll: async () => {
    const response = await api.get<CodeTemplateDto[]>('/CodeTemplates');
    return response.data;
  },

  update: async (id: string, payload: UpdateCodeTemplateRequest) => {
    const response = await api.put(`/CodeTemplates/${id}`, payload);
    return response.data;
  }
};
