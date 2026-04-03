import { apiClient } from './client';

export interface InvoiceItemApi {
  id?: number;
  description: string;
  ncm?: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}

export interface InvoicePaymentApi {
  id?: number;
  payment_method: string;
  amount: number;
  description?: string;
}

export interface Invoice {
  id: number;
  service_order_id: number;
  store_id: number;
  invoice_number: string;
  series: string;
  status: string;
  status_message?: string | null;
  brasilnfe_response?: { Error?: string; [key: string]: any } | null;
  total_value: number;
  emission_date: string;
  access_key: string | null;
  protocol: string | null;
  authorization_date: string | null;
  created_at: string;
  updated_at: string;
  original_invoice_id?: number | null;
  devolucao_invoice?: Invoice | null;
  qr_code_url?: string | null;
  pdf_base64?: string | null;
  service_order?: {
    id: number;
    os_number: number;
    client?: { id: number; name: string; document?: string; email?: string; phone?: string } | null;
  } | null;
  store?: { id: number; name: string; fancy_name?: string; receipt_header?: string | null; unity?: string; cnpj?: string; ie?: string; logradouro?: string; numero?: string; bairro?: string; municipio?: string; uf?: string; cep?: string; telefone?: string; email?: string } | null;
  items?: InvoiceItemApi[];
  payments?: InvoicePaymentApi[];
}

export interface InvoiceReadResponse {
  success: boolean;
  action: string;
  data: { invoice: Invoice };
}

export interface GenerateInvoiceResponse {
  success: boolean;
  action: string;
  data: {
    invoice: Invoice;
    message: string;
  };
}

export interface InvoiceListResponse {
  success: boolean;
  action: string;
  data: {
    invoices: Invoice[];
    meta: {
      current_page: number;
      total_pages: number;
      total_items: number;
      per_page: number;
    };
  };
}

export interface InvoiceStatsResponse {
  success: boolean;
  action: string;
  data: {
    stats: {
      month_count: number;
      month_value: number;
      total_count: number;
      total_value: number;
      authorized_count: number;
      nfe_count: number;
      nfce_count: number;
    };
  };
}

export interface InvoiceListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  tipo?: 'nfe' | 'nfce';
  store_id?: number | string;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  /** Formato do arquivo de exportação: zip ou rar */
  format?: 'zip' | 'rar';
}

const endpoint = '/v1/invoices';

export const invoicesService = {
  /**
   * Listar notas fiscais com filtros e paginação.
   */
  async list(params: InvoiceListParams = {}): Promise<{ invoices: Invoice[]; meta: InvoiceListResponse['data']['meta'] }> {
    const { data } = await apiClient.get<InvoiceListResponse>(endpoint, { params });
    if (!data.success || !data.data) {
      throw new Error('Erro ao listar notas fiscais');
    }
    const rawInvoices = data.data.invoices;
    const invoices = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices ? Object.values(rawInvoices) : []);
    return {
      invoices,
      meta: data.data.meta || { current_page: 1, total_pages: 1, total_items: 0, per_page: 15 },
    };
  },

  /**
   * Estatísticas de NF-e/NFC-e (mês, total, autorizadas, NF-e/NFC-e).
   * Aceita os mesmos filtros da listagem para atualizar valores conforme filtro.
   */
  async stats(params?: Pick<InvoiceListParams, 'store_id' | 'status' | 'tipo' | 'date_from' | 'date_to'>): Promise<InvoiceStatsResponse['data']['stats']> {
    const { data } = await apiClient.get<InvoiceStatsResponse>(`${endpoint}/stats`, params && Object.keys(params).length ? { params } : undefined);
    if (!data.success || !data.data?.stats) {
      throw new Error('Erro ao carregar estatísticas');
    }
    return data.data.stats;
  },

  /**
   * Buscar uma nota fiscal por ID (dados reais para visualização).
   */
  async getById(id: string): Promise<Invoice> {
    const { data } = await apiClient.get<InvoiceReadResponse>(`${endpoint}/${id}`);
    if (!data.success || !data.data?.invoice) {
      throw new Error((data as any).data?.errors?.message || 'Nota fiscal não encontrada');
    }
    return data.data.invoice;
  },

  /**
   * Gerar e transmitir NF-e ou NFC-e a partir de uma OS.
   * OS finalizada ou com pagamento diferente de "na retirada"; sem NF-e já emitida.
   * modelo: 55 = NF-e, 65 = NFC-e (cupom). Se omitido, usa config.
   * retry: quando true, remove NF-e rejeitada e gera novamente (para erros não-SEFAZ).
   * includeDocument: quando false, emite como consumidor não identificado (sem CPF/CNPJ).
   */
  async generateFromServiceOrder(
    serviceOrderId: string,
    transmit: boolean = true,
    modelo?: 55 | 65,
    retry?: boolean,
    includeDocument: boolean = false
  ): Promise<Invoice> {
    try {
      const { data } = await apiClient.post<GenerateInvoiceResponse>(
        `${endpoint}/service-orders/${serviceOrderId}/generate`,
        { transmit, modelo, retry, include_document: includeDocument }
      );
      if (!data.success || !data.data?.invoice) {
        throw new Error((data as any).data?.errors?.message || 'Erro ao gerar NF-e');
      }
      return data.data.invoice;
    } catch (e: any) {
      const msg =
        e?.response?.data?.data?.errors?.message || e?.message || 'Erro ao gerar NF-e';
      throw new Error(msg);
    }
  },

  /**
   * Baixar PDF (DANFE) da NF-e.
   */
  async downloadPdf(invoiceId: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(`${endpoint}/${invoiceId}/download/pdf`, {
      responseType: 'blob',
    });
    return response.data as unknown as Blob;
  },

  /**
   * Baixar XML da NF-e (individual).
   */
  async downloadXml(invoiceId: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(`${endpoint}/${invoiceId}/download/xml`, {
      responseType: 'blob',
    });
    return response.data as unknown as Blob;
  },

  /**
   * Exportar XMLs em ZIP ou RAR (mesmos filtros da listagem; apenas notas autorizadas).
   * Retorna blob e nome do arquivo (geral ou nome da loja) vindo do Content-Disposition.
   */
  async downloadXmlZip(params: Omit<InvoiceListParams, 'page' | 'per_page'> = {}): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.get<Blob>(`${endpoint}/export/xml`, {
      params: { ...params, per_page: undefined, page: undefined },
      responseType: 'blob',
    });
    const blob = response.data as unknown as Blob;
    const disposition = (response as any).headers?.['content-disposition'];
    let filename = `NF-e-xml-${new Date().toISOString().slice(0, 10)}.${params.format === 'rar' ? 'rar' : 'zip'}`;
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i) || disposition.match(/filename="?([^";\n]+)"?/i);
      if (match && match[1]) filename = match[1].trim().replace(/^["']|["']$/g, '');
    }
    return { blob, filename };
  },

  /**
   * Gerar NF-e de devolução a partir desta NF-e de venda (autorizada).
   */
  async gerarDevolucao(invoiceId: string | number, transmit: boolean = true): Promise<Invoice> {
    const { data } = await apiClient.post<GenerateInvoiceResponse>(
      `${endpoint}/${invoiceId}/gerar-devolucao`,
      { transmit }
    );
    if (!data.success || !data.data?.invoice) {
      throw new Error((data as any).data?.errors?.message || 'Erro ao gerar nota de devolução');
    }
    return data.data.invoice;
  },

  /**
   * Cancelar NF-e (justificativa mín. 15 caracteres).
   */
  async cancel(invoiceId: string | number, reason: string): Promise<Invoice> {
    const { data } = await apiClient.post<InvoiceReadResponse & { data: { invoice: Invoice; message: string } }>(
      `${endpoint}/${invoiceId}/cancel`,
      { reason }
    );
    if (!data.success || !data.data?.invoice) {
      throw new Error((data as any).data?.errors?.message || 'Erro ao cancelar NF-e');
    }
    return data.data.invoice;
  },

  /**
   * Enviar Carta de Correção (CC-e). Texto entre 15 e 1000 caracteres.
   */
  async sendCartaCorrecao(invoiceId: string | number, correcao: string): Promise<Invoice> {
    const { data } = await apiClient.post<InvoiceReadResponse & { data: { invoice: Invoice; message: string } }>(
      `${endpoint}/${invoiceId}/carta-correcao`,
      { correcao }
    );
    if (!data.success || !data.data?.invoice) {
      throw new Error((data as any).data?.errors?.message || 'Erro ao enviar Carta de Correção');
    }
    return data.data.invoice;
  },

  /**
   * Manifestação do Destinatário.
   * tipo: 210200=Ciência, 210210=Confirmação, 210220=Desconhecimento, 210240=Não realizada.
   */
  async manifestacao(invoiceId: string | number, tipo: number, justificativa?: string): Promise<Invoice> {
    const { data } = await apiClient.post<InvoiceReadResponse & { data: { invoice: Invoice; message: string } }>(
      `${endpoint}/${invoiceId}/manifestacao`,
      { tipo, justificativa: justificativa || undefined }
    );
    if (!data.success || !data.data?.invoice) {
      throw new Error((data as any).data?.errors?.message || 'Erro ao registrar manifestação');
    }
    return data.data.invoice;
  },

  /**
   * Inutilizar numeração (faixa de números não utilizados).
   */
  async inutilizarNumeracao(payload: {
    serie: number;
    numero_inicial: number;
    numero_final: number;
    justificativa: string;
    modelo?: 55 | 65;
    ano?: number;
    store_id?: number;
  }): Promise<unknown> {
    const { data } = await apiClient.post<{ success: boolean; action: string; data: unknown }>(
      `${endpoint}/inutilizar-numeracao`,
      payload
    );
    if (!data.success) {
      throw new Error((data as any).data?.errors?.message || 'Erro ao inutilizar numeração');
    }
    return data.data;
  },
};
