export type Environment = "sandbox" | "production";

export interface InvoiceItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uoM: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
}

export interface InvoicePayload {
  invoiceType: "Sale Invoice" | "Debit Note";
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: "Registered" | "Unregistered";
  invoiceRefNo: string;
  scenarioId?: string;
  items: InvoiceItem[];
}

export interface InvoiceItemStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo: string | null;
  errorCode: string;
  error: string;
}

export interface ValidationResponse {
  statusCode: string;
  status: string;
  errorCode?: string;
  error: string;
  invoiceStatuses: InvoiceItemStatus[] | null;
}

export interface InvoiceResponse {
  invoiceNumber?: string;
  dated: string;
  validationResponse: ValidationResponse;
}

export interface Province {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}

export interface DocType {
  docTypeId: number;
  docDescription: string;
}

export interface UoM {
  uoM_ID: number;
  description: string;
}

export interface RateOption {
  ratE_ID: number;
  ratE_DESC: string;
  ratE_VALUE: number;
}

export interface TransactionType {
  transactioN_TYPE_ID: number;
  transactioN_DESC: string;
}

export interface SroSchedule {
  srO_ID: number;
  srO_DESC: string;
}

export interface SroItem {
  srO_ITEM_ID: number;
  srO_ITEM_DESC: string;
}

export interface HsCode {
  hS_CODE: string;
  description: string;
}
