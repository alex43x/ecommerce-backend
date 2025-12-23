import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';

const { print } = pkg;

const TICKET_PATH = './ticket.pdf';

const translateMode = {
  local: 'En local',
  carry: 'Para llevar',
  delivery: 'Delivery'
};

const MARGIN = 2;
const IMAGE_HEIGHT = 50;

/**
 * Ajuste horario Paraguay
 */
function restar3HorasYFormatear(fechaISO) {
  const fecha = new Date(fechaISO);
  fecha.setUTCHours(fecha.getUTCHours() - 3);
  return fecha.toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Altura dinámica del ticket
 */
function calcularAlturaNecesaria(sale) {
  let altura = 230;

  altura += sale.products.length * 12;

  if (sale.payment?.length) {
    altura += 20 + sale.payment.length * 10;
  }

  if (sale.invoiced) {
    altura += 40;
  }

  return Math.ceil(altura);
}

/**
 * Generar PDF del ticket
 */
function generarPDFTicket(sale) {
  return new Promise((resolve, reject) => {
    const altura = calcularAlturaNecesaria(sale);

    const doc = new PDFDocument({
      size: [226, altura],
      margin: MARGIN
    });

    const stream = fs.createWriteStream(TICKET_PATH);
    doc.pipe(stream);

    const pageWidth = 226;
    const imageWidth = 50;
    const x = (pageWidth - imageWidth) / 2;

    try {
      doc.image('./assets/logo.png', x, undefined, {
        width: imageWidth,
        height: IMAGE_HEIGHT
      });
    } catch {
      logger.warn('Logo no encontrado, se continúa sin logo');
    }

    // ENCABEZADO
    doc.fontSize(10).text('Eso Que Te Gusta', { align: 'center' });
    doc.fontSize(9).text('Oliva entre 14 de Mayo y 15 de Agosto', { align: 'center' });
    doc.fontSize(9).text('Tel: 0991 401621', { align: 'center' });
    doc.moveDown(0.5);

    /*doc.fontSize(10).text(
      sale.invoiced ? 'FACTURA' : 'COMPROBANTE DE PAGO',
      { align: 'center' }
    );*/
    doc.fontSize(10).text('TICKET DE VENTA', { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(8);
    doc.text(`Cliente: ${sale.customerName}`);
    doc.text(`RUC: ${sale.ruc}`);
    doc.text(`Orden #: ${sale.dailyId}`);
    doc.text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);
    doc.text(`Vendedor: ${sale.user?.name || '---'}`);
    doc.text(`Consumo: ${translateMode[sale.mode]}`);

    // DATOS DE FACTURA / TIMBRADO
    /*
    if (sale.invoiced) {
      doc.moveDown(0.3);
      doc.text(`Factura N°: ${sale.invoiceNumber}`);
      doc.text(`Timbrado: ${sale.timbradoNumber}`);
      doc.text(`Vence: ${new Date(sale.timbradoIn).toLocaleDateString('es-PY')}`);
    }*/

    doc.moveDown();
    doc.fontSize(9).text('DETALLE', { underline: true });

    // PRODUCTOS
    sale.products.forEach(p => {
      doc.fontSize(8)
        .text(`${p.quantity} x ${p.name}`, { continued: true })
        .text(`${p.totalPrice.toLocaleString('es-PY')} Gs`, { align: 'right' });
    });

    doc.text('----------------------------------------------', { align: 'center' });

    // TOTALES FISCALES
    doc.fontSize(8);

    if (sale.totals.gravada10 > 0) {
      doc.text(`Gravada 10%: ${Math.round(sale.totals.gravada10).toLocaleString('es-PY')} Gs`);
      doc.text(`IVA 10%: ${Math.round(sale.totals.iva10).toLocaleString('es-PY')} Gs`);
    }

    if (sale.totals.gravada5 > 0) {
      doc.text(`Gravada 5%: ${Math.round(sale.totals.gravada5).toLocaleString('es-PY')} Gs`);
      doc.text(`IVA 5%: ${Math.round(sale.totals.iva5).toLocaleString('es-PY')} Gs`);
    }

    if (sale.totals.exenta > 0) {
      doc.text(`Exenta: ${Math.round(sale.totals.exenta).toLocaleString('es-PY')} Gs`);
    }

    doc.moveDown(0.3);
    doc.fontSize(10).text(
      `TOTAL: ${Math.round(sale.totalAmount).toLocaleString('es-PY')} Gs`,
      { align: 'right' }
    );

    doc.text('----------------------------------------------', { align: 'center' });

    // MÉTODOS DE PAGO
    if (sale.payment?.length) {
      doc.fontSize(9).text('Pagos:');
      sale.payment.forEach(p => {
        const label = {
          cash: 'Efectivo',
          card: 'Tarjeta',
          qr: 'QR',
          transfer: 'Transferencia'
        }[p.paymentMethod] || p.paymentMethod;

        doc.fontSize(8).text(
          `${label}: ${p.totalAmount.toLocaleString('es-PY')} Gs`
        );
      });
    }

    doc.moveDown();
    doc.fontSize(9).text(
      'Gracias por su compra',
      { align: 'center' }
    );

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Enviar ticket a impresora
 */
export async function imprimirVenta(sale, printerName) {
  try {
    await generarPDFTicket(sale);
    await print(TICKET_PATH, {
      printer: printerName,
      silent: true
    });

    logger.info('Ticket impreso correctamente', {
      saleId: sale._id,
      printer: printerName
    });
  } catch (error) {
    logger.error('Error imprimiendo ticket', {
      error: error.message,
      saleId: sale?._id
    });
    throw error;
  }
}
