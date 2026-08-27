import { offlineFetchPdf } from '../offline/api-client';

export async function abrirPdfFactura(id: string) {
  try {
    const blob = await offlineFetchPdf(`/api/facturas/${id}/pdf`);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err: any) {
    // Show user-friendly message for offline
    alert(err.message || 'No se pudo generar el PDF');
  }
}
