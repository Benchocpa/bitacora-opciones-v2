export interface Operacion {
  id?: string;
  fechaInicio: string;
  fechaVencimiento: string;
  fechaCierre: string;
  ticker: string;
  prima?: number;
  costos?: number;
  neto?: number;
  roi?: number;
}
