import api from './api';

export interface TechnicalParameter {
  id: string;
  parameterType: number;
  code: string;
  numericValue: number;
  description: string;
}

export interface CreateTechnicalParameter {
  parameterType: number;
  numericValue: number;
  description: string;
}

export interface UpdateTechnicalParameter {
  id: string;
  parameterType: number;
  numericValue: number;
  description: string;
}

export const technicalParameterApi = {
  getAll: async (params?: { page?: number; pageSize?: number; search?: string; type?: number }) => {
    const response = await api.get('/TechnicalParameter', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<TechnicalParameter>(`/TechnicalParameter/${id}`);
    return response.data;
  },

  create: async (data: CreateTechnicalParameter) => {
    const response = await api.post<TechnicalParameter>('/TechnicalParameter', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTechnicalParameter) => {
    const response = await api.put(`/TechnicalParameter/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/TechnicalParameter/${id}`);
    return response.data;
  }
};
