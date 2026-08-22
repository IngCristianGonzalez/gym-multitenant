export async function abrirPdfFactura(id: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/facturas/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo generar el PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
