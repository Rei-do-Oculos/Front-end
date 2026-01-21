
export interface Client {
  id: string;
  name: string;
  cpf: string;
  phone1: string;
  phone2?: string;
  recado?: string;
  createdAt: string;
}

export interface Frame {
  id: string;
  description: string;
  code: string;
  type: string;
  gender: 'Masculino' | 'Feminino' | 'Unissex';
  createdAt: string;
  location?: string;
}

export interface Order {
  id: string;
  osNumber: string;
  clientName: string;
  optician: string;
  price: number;
  registeredBy: string;
  hasWarranty: boolean;
  createdAt: string;
  farRx?: {
    od: { sph: string; cyl: string; axis: string };
    oe: { sph: string; cyl: string; axis: string };
  };
  nearRx?: {
    od: { sph: string; cyl: string; axis: string };
    oe: { sph: string; cyl: string; axis: string };
  };
}

export interface Brand {
  id: string;
  name: string;
  createdAt: string;
}

export interface Optician {
  id: string;
  name: string;
  createdAt: string;
}
