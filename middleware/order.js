import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
const { print } = pkg;

const KITCHEN_TICKET_PATH = './kitchen_ticket.pdf';

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
const MARGIN = 5;

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
    // Altura base fija
    const ALTURA_BASE = 120; // Altura de todas las secciones fijas
    
    // Altura por línea según tamaño de fuente
    const ALTURA_LINEA_SMALL = FONT_SIZE_SMALL * LINE_HEIGHT_RATIO;
    
    // Calcular altura dinámica de productos
    let alturaDinamica = 0;
    
    // Cada producto ocupa 1 línea
    alturaDinamica += ALTURA_LINEA_SMALL * sale.products.length;
    
    // Altura total = base + dinámica + márgenes
    const alturaTotal = ALTURA_BASE + alturaDinamica + (MARGIN * 2);
    
    // Asegurar una altura mínima y máxima razonable
    return Math.ceil(alturaTotal);
}

/**
 * Genera el PDF del ticket de cocina con altura dinámica.
 * @param {Object} sale - Objeto venta completo
 * @returns {Promise<void>}
 */
function generarPDFCocina(sale) {
    return new Promise((resolve, reject) => {
        // Calcular altura dinámica según productos
        const alturaCalculada = calcularAlturaCocina(sale);
        
        const doc = new PDFDocument({ 
            size: [220, alturaCalculada], 
            margin: MARGIN 
        });
        
        const stream = fs.createWriteStream(KITCHEN_TICKET_PATH);
        doc.pipe(stream);
        doc.moveDown(0.5);

        // Encabezado simple
        doc.fontSize(FONT_SIZE_LARGE).text('ORDEN DE COCINA', { 
            align: 'center', 
            underline: true 
        });
        doc.moveDown(0.5);

        doc.fontSize(FONT_SIZE_REGULAR).text(`RUC: ${sale.ruc}    N° Orden: ${sale.dailyId}`, { 
            align: 'left' 
        });
        doc.fontSize(FONT_SIZE_REGULAR).text(`Cliente: ${sale.customerName}`);
        doc.fontSize(FONT_SIZE_SMALL).text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);
        doc.text(`Vendedor: ${sale.user?.name || '---'}  Consumo: ${translateMode[sale.mode] || sale.mode}`);
        doc.moveDown();

        doc.fontSize(FONT_SIZE_REGULAR).text('Detalle:', { underline: true });

        // Lista de productos
        sale.products.forEach(p => {
            const totalGs = p.totalPrice.toLocaleString("es-PY");
            doc.fontSize(FONT_SIZE_SMALL)
                .text(`${p.quantity} x ${p.name}`, { continued: true })
                .text(`${totalGs} Gs`, { align: 'right' });
        });

        doc.text('-----------------------------------------------------------------', { 
            align: 'center' 
        });

        // Totales
        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);
        doc.fontSize(FONT_SIZE_SMALL)
            .text(`Subtotal: ${roundedSubtotal.toLocaleString("es-PY")} Gs   IVA 10%: ${sale.iva.toLocaleString("es-PY")} Gs`, { align: 'left' });
        doc.fontSize(FONT_SIZE_REGULAR)
            .text(`Total: ${sale.totalAmount.toLocaleString("es-PY")} Gs`, { align: 'left' });

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