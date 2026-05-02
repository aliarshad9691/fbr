import "server-only";
import type { Environment } from "./types";

const FBR_BASE = "https://gw.fbr.gov.pk";

export const FBR_ENDPOINTS = {
  postInvoice: (env: Environment) =>
    env === "production"
      ? `${FBR_BASE}/di_data/v1/di/postinvoicedata`
      : `${FBR_BASE}/di_data/v1/di/postinvoicedata_sb`,

  validateInvoice: (env: Environment) =>
    env === "production"
      ? `${FBR_BASE}/di_data/v1/di/validateinvoicedata`
      : `${FBR_BASE}/di_data/v1/di/validateinvoicedata_sb`,

  provinces: () => `${FBR_BASE}/pdi/v1/provinces`,
  docTypes: () => `${FBR_BASE}/pdi/v1/doctypecode`,
  hsCodes: () => `${FBR_BASE}/pdi/v1/itemdesccode`,
  sroItemCode: () => `${FBR_BASE}/pdi/v1/sroitemcode`,
  transTypes: () => `${FBR_BASE}/pdi/v1/transtypecode`,
  uom: () => `${FBR_BASE}/pdi/v1/uom`,
  sroSchedule: (rateId: number, date: string, originationSupplierCsv: number) =>
    `${FBR_BASE}/pdi/v1/SroSchedule?rate_id=${rateId}&date=${encodeURIComponent(date)}&origination_supplier_csv=${originationSupplierCsv}`,
  saleTypeToRate: (date: string, transTypeId: number, originationSupplier: number) =>
    `${FBR_BASE}/pdi/v2/SaleTypeToRate?date=${encodeURIComponent(date)}&transTypeId=${transTypeId}&originationSupplier=${originationSupplier}`,
  hsUom: (hsCode: string, annexureId: number) =>
    `${FBR_BASE}/pdi/v2/HS_UOM?hs_code=${encodeURIComponent(hsCode)}&annexure_id=${annexureId}`,
  sroItem: (date: string, sroId: number) =>
    `${FBR_BASE}/pdi/v2/SROItem?date=${encodeURIComponent(date)}&sro_id=${sroId}`,
  statl: () => `${FBR_BASE}/dist/v1/statl`,
  regType: () => `${FBR_BASE}/dist/v1/Get_Reg_Type`,
};
