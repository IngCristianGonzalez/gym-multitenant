import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

interface FacturaParaPdf {
  numeroFactura: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  total: number;
  metodoPago: string;
  miembro: {
    identificacion: string;
    primerNombre: string;
    segundoNombre?: string | null;
    primerApellido: string;
    segundoApellido?: string | null;
    celular: string;
    correo?: string | null;
    direccion?: string | null;
  };
  empresa: {
    nombre: string;
    nit: string;
    resolucionFactura?: string | null;
    colorPrimario?: string | null;
  };
  detalles: Array<{
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

@Injectable()
export class PdfService {
  generarFactura(factura: FacturaParaPdf): PDFKit.PDFDocument {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const color = factura.empresa.colorPrimario || '#3b82f6';
    const nombreCompleto =
      `${factura.miembro.primerNombre} ${factura.miembro.segundoNombre ?? ''} ` +
      `${factura.miembro.primerApellido} ${factura.miembro.segundoApellido ?? ''}`.trim();

    doc
      .fillColor(color)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(factura.empresa.nombre, 50, 50, { align: 'left' })
      .fontSize(10)
      .fillColor('#444444')
      .font('Helvetica')
      .text(`NIT: ${factura.empresa.nit}`, 50, 80)
      .text(
        factura.empresa.resolucionFactura
          ? `Resolución: ${factura.empresa.resolucionFactura}`
          : '',
        50,
        95,
      );

    doc
      .fillColor('#000000')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('FACTURA', 400, 50, { align: 'right' })
      .fontSize(11)
      .font('Helvetica')
      .text(factura.numeroFactura, 400, 75, { align: 'right' })
      .text(
        `Fecha: ${factura.fechaEmision.toLocaleDateString()}`,
        400,
        92,
        { align: 'right' },
      );

    doc.moveTo(50, 130).lineTo(545, 130).stroke();
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Cliente', 50, 140)
      .font('Helvetica')
      .fontSize(10)
      .text(`Nombre: ${nombreCompleto}`, 50, 158)
      .text(`Identificación: ${factura.miembro.identificacion}`, 50, 173)
      .text(`Celular: ${factura.miembro.celular}`, 50, 188)
      .text(`Correo: ${factura.miembro.correo ?? 'N/A'}`, 50, 203);

    let y = 250;
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Concepto', 50, y)
      .text('Cant.', 320, y)
      .text('P. Unit.', 390, y)
      .text('Subtotal', 470, y);
    y += 8;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 12;

    doc.font('Helvetica').fontSize(10);
    for (const d of factura.detalles) {
      doc
        .text(d.concepto, 50, y)
        .text(String(d.cantidad), 320, y)
        .text(`$${d.precioUnitario.toFixed(2)}`, 390, y)
        .text(`$${d.subtotal.toFixed(2)}`, 470, y);
      y += 22;
    }

    y += 10;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 14;
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(`TOTAL: $${factura.total.toFixed(2)}`, 400, y, { align: 'right' })
      .fontSize(10)
      .font('Helvetica')
      .text(`Método de pago: ${factura.metodoPago}`, 400, y + 22, {
        align: 'right',
      })
      .text(
        `Vigencia hasta: ${factura.fechaVencimiento.toLocaleDateString()}`,
        400,
        y + 38,
        { align: 'right' },
      );

    doc
      .fontSize(9)
      .fillColor('#888888')
      .text(
        'Este documento es una factura interna. Precio final incluye IVA.',
        50,
        760,
      );

    return doc;
  }
}
