import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
import Sale from '../models/sales.js';
const { print } = pkg;

const KITCHEN_TICKET_PATH = './kitchen_ticket.pdf';

// Traducción del modo de venta
const translateMode = {
    local: 'En local',
    carry: 'Para llevar',
    delivery: 'Delivery'
};

// Formato de fecha a GMT-3
function restar3HorasYFormatear(fechaISO) {
    const fecha = new Date(fechaISO);
    fecha.setUTCHours(fecha.getUTCHours() - 3);

    const opciones = {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    return fecha.toLocaleString('es-ES', opciones);
}

/**
 * Genera el PDF del ticket de cocina.
 * @param {Object} sale - Objeto venta completo
 * @returns {Promise<void>}
 */
function generarPDFCocina(sale) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [220, 400], margin: 5 });
        const stream = fs.createWriteStream(KITCHEN_TICKET_PATH);
        doc.pipe(stream);

        // Encabezado simple
        doc.fontSize(12).text('ORDEN DE COCINA', { align: 'center', underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10).text(`RUC: ${sale.ruc}    N° Orden: ${sale.dailyId}`, { align: 'left' });
        doc.fontSize(10).text(`Cliente: ${sale.customerName}`);
        doc.fontSize(10).text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);
        doc.text(`Vendedor: ${sale.user?.name || '---'}  Consumo:${translateMode[sale.mode] || sale.mode}`);
        doc.moveDown();

        doc.fontSize(10).text('Detalle:', { underline: true });

        sale.products.forEach(p => {
            const totalGs = p.totalPrice.toLocaleString("es-PY");
            doc.fontSize(9)
                .text(`${p.quantity} x ${p.name}`, { continued: true })
                .text(`${totalGs} Gs`, { align: 'right' });
        });

        doc.text('-----------------------------------------------------------------', { align: 'center' });

        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);
        doc.fontSize(9).text(`Subtotal: ${roundedSubtotal.toLocaleString("es-PY")} Gs`, { align: 'left' });
        doc.text(`IVA 10%: ${sale.iva.toLocaleString("es-PY")} Gs`, { align: 'left' });
        doc.fontSize(10).text(`Total: ${sale.totalAmount.toLocaleString("es-PY")} Gs`, { align: 'left' });


        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', reject);
    });
}

/**
 * Imprime la orden de cocina: genera el PDF y envía a la impresora.
 * @param {Object} sale - Objeto de venta completo
 * @param {string} printerName - Nombre exacto de la impresora de cocina
 */
export async function imprimirOrdenCocina(sale, printerName) {
    try {
        await generarPDFCocina(sale);
        await print(KITCHEN_TICKET_PATH, {
            printer: printerName,
            silent: true
        });
        logger.info("Orden de cocina enviada a la impresora");
    } catch (error) {
        logger.error('Error imprimiendo la orden de cocina:', error.message);
        throw error;
    }
}
