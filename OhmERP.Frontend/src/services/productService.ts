import api from './api';

export interface ProductDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  firmId: string;
  voltParameterId: string;
  wattParameterId: string;
  ohmValue: number;
  pipeLength: number;
  rolledLength: number;
  wireId: string;
  isDoubleWound: boolean;
  sheetId: string;
  gasId: string;
  pinId: string;
  plug1Id: string;
  plug1Qty: number;
  plug2Id?: string;
  plug2Qty?: number;
  socket1Id: string;
  socket1Qty: number;
  socket2Id?: string;
  socket2Qty?: number;
  flangeId?: string;
  flangeQty?: number;
  clampId?: string;
  clampQty?: number;
  omegaId?: string;
  omegaQty?: number;
  connectionSheetId?: string;
  connectionSheetQty?: number;
  connectionWireId?: string;
  connectionWireQty?: number;
  connectionWireLength?: number;
  isOvened: string;
  marking: string;
  packageType: string;
  sandId?: string;
  isMixedSand: boolean;
  mixedSand1Id?: string;
  mixedSand1Ratio?: number;
  mixedSand2Id?: string;
  mixedSand2Ratio?: number;
  description?: string;
  innerDetail?: any;
  operations: any[];
  images: any[];
}

export const productService = {
  getAll: async () => {
    const response = await api.get<ProductDto[]>('/Product');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<ProductDto>(`/Product/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post<ProductDto>('/Product', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put<ProductDto>(`/Product/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/Product/${id}`);
  }
};
