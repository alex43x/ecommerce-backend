import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
const { print } = pkg;

const KITCHEN_TICKET_PATH = './kitchen_ticket.pdf';

// Ancho real compatible con Bematech (56mm aprox)
const PAGE_WIDTH = 226;

const translateMode = {
    local: 'En local',
    carry: 'Para llevar',
    delivery: 'Delivery'
};

// Configuración visual
const LINE_HEIGHT_RATIO = 1.15;
const FONT_SIZE_SMALL = 9;
const FONT_SIZE_REGULAR = 11;
const FONT_SIZE_LARGE = 12;

// Márgenes
const PADDING_LEFT_RIGHT = 5;
const PADDING_TOP = 10;

// Altura mínima anti-rotación
const MIN_ALTURA = 240;

// Formato fecha GMT-3
function restar3HorasYFormatear(fechaISO) {
    const fecha = new Date(fechaISO);
    fecha.setUTCHours(fecha.getUTCHours() - 3);

    return fecha.toLocaleString('es-ES', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Cálculo de altura según productos
function calcularAlturaCocina(sale) {
    const ALTURA_BASE = 140;
    const ALTURA_LINEA = FONT_SIZE_SMALL * LINE_HEIGHT_RATIO;

    let altura = ALTURA_BASE;
    altura += ALTURA_LINEA * sale.products.length;

    return Math.ceil(altura);
}

// Generación del PDF
function generarPDFCocina(sale) {
    return new Promise((resolve, reject) => {

        let alturaCalculada = calcularAlturaCocina(sale);

        if (alturaCalculada < MIN_ALTURA) {
            alturaCalculada = MIN_ALTURA;
        }

        // *** CORREGIDO: ancho primero, alto después ***
        const doc = new PDFDocument({
            size: [PAGE_WIDTH, alturaCalculada],
            margin: 0
        });

        const stream = fs.createWriteStream(KITCHEN_TICKET_PATH);
        doc.pipe(stream);

        doc.y = PADDING_TOP;
        doc.x = PADDING_LEFT_RIGHT;

        // Encabezado
        doc.fontSize(FONT_SIZE_LARGE)
            .text('ORDEN DE COCINA', {
                align: 'center',
                underline: true
            });

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
            const total = p.totalPrice.toLocaleString('es-PY');

            doc.fontSize(FONT_SIZE_SMALL)
                .text(`${p.quantity} x ${p.name}`, { continued: true })
                .text(`${total} Gs`, { align: 'right' });
        });

        // Separador
        doc.text('----------------------------------------------', { align: 'center' });

        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);

        // Totales
        doc.fontSize(FONT_SIZE_SMALL)
            .text(
                `Subtotal: ${roundedSubtotal.toLocaleString('es-PY')} Gs    IVA 10%: ${sale.iva.toLocaleString('es-PY')} Gs`
            );

        doc.fontSize(FONT_SIZE_REGULAR)
            .text(`Total: ${sale.totalAmount.toLocaleString('es-PY')} Gs`);

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

// Impresión
export async function imprimirOrdenCocina(sale, printerName) {
    try {
        await generarPDFCocina(sale);

        // *** CORREGIDO: NO usar orientation, causa rotación ***
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
