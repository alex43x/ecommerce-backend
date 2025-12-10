import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
const { print } = pkg;

const KITCHEN_TICKET_PATH = './kitchen_ticket.pdf';

const PAGE_WIDTH = 226;

// Traducción del modo de venta
const translateMode = {
    local: 'En local',
    carry: 'Para llevar',
    delivery: 'Delivery'
};

// Constantes para cálculo de altura
const LINE_HEIGHT_RATIO = 1.15;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_REGULAR = 9;
const FONT_SIZE_LARGE = 10;
const MARGIN = 2;

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
 * Calcula la altura necesaria para el ticket de cocina
 */
function calcularAlturaCocina(sale) {
    const ALTURA_BASE = 110;
    const ALTURA_LINEA_SMALL = FONT_SIZE_SMALL * LINE_HEIGHT_RATIO;

    let alturaDinamica = 0;
    alturaDinamica += ALTURA_LINEA_SMALL * sale.products.length;

    const alturaTotal = ALTURA_BASE + alturaDinamica + (MARGIN * 2);
    return Math.ceil(alturaTotal);
}

/**
 * Genera el PDF del ticket de cocina
 */
function generarPDFCocina(sale) {
    return new Promise((resolve, reject) => {
        const alturaCalculada = calcularAlturaCocina(sale);

        //  CONFIGURACIÓN CORRECTA PARA BEMATECH
        const doc = new PDFDocument({
            size: [PAGE_WIDTH, alturaCalculada],
            layout: 'portrait', // Para que no rote
            margin: MARGIN
        });

        const stream = fs.createWriteStream(KITCHEN_TICKET_PATH);
        doc.pipe(stream);


        // Encabezado
        doc.fontSize(FONT_SIZE_LARGE)
           .text('ORDEN DE COCINA', { align: 'center', underline: true });

        doc.moveDown(0.5);

        doc.fontSize(FONT_SIZE_REGULAR)
           .text(`RUC: ${sale.ruc}    N° Orden: ${sale.dailyId}`);

        doc.text(`Cliente: ${sale.customerName}`);
        doc.fontSize(FONT_SIZE_SMALL)
           .text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);

        doc.text(
            `Vendedor: ${sale.user?.name || '---'}  Consumo: ${translateMode[sale.mode] || sale.mode}`
        );

        doc.moveDown();
        doc.fontSize(FONT_SIZE_REGULAR)
           .text('Detalle:', { underline: true });

        // Productos
        sale.products.forEach(p => {
            const totalGs = p.totalPrice.toLocaleString('es-PY');
            doc.fontSize(FONT_SIZE_SMALL)
                .text(`${p.quantity} x ${p.name}`, { continued: true })
                .text(`${totalGs} Gs`, { align: 'right' });
        });

        doc.text('----------------------------------------------', { align: 'center' });

        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);

        doc.fontSize(FONT_SIZE_SMALL)
            .text(
                `Subtotal: ${roundedSubtotal.toLocaleString('es-PY')} Gs   IVA 10%: ${sale.iva.toLocaleString('es-PY')} Gs`
            );

        doc.fontSize(FONT_SIZE_REGULAR)
            .text(`Total: ${sale.totalAmount.toLocaleString('es-PY')} Gs`);

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

/**
 * Imprime orden de cocina
 */
export async function imprimirOrdenCocina(sale, printerName) {
    try {
        await generarPDFCocina(sale);
        await print(KITCHEN_TICKET_PATH, {
            printer: printerName,
            silent: true,
            printDialog: false
        });

        logger.info('Orden de cocina enviada a la impresora');
    } catch (error) {
        logger.error('Error imprimiendo la orden de cocina:', error.message);
        throw error;
    }
}
