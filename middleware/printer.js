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

// Constantes de diseño para cálculo de altura
const LINE_HEIGHT_RATIO = 1.15; // Factor de espacio entre líneas
const FONT_SIZE_REGULAR = 9;
const FONT_SIZE_LARGE = 10;
const PAGE_WIDTH = 210; // Ancho útil después de márgenes
const MARGIN = 2;
const IMAGE_HEIGHT = 50; // Altura estimada del logo

function restar3HorasYFormatear(fechaISO) {
    const fecha = new Date(fechaISO);
    fecha.setUTCHours(fecha.getUTCHours() - 3);
    return fecha.toLocaleString('es-ES', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Calcula la altura necesaria sin crear un PDF temporal
 */
/**
 * Calcula la altura necesaria - versión optimizada y precisa
 */
function calcularAlturaNecesaria(sale) {
    // Constantes de altura
    const ALTURA_LINEA_REGULAR = 10.35; // 9 * 1.15
    const ALTURA_LINEA_LARGE = 11.5;    // 10 * 1.15

    let alturaTotal = 230; // Ajusta este valor según pruebas

    // Agregar altura de productos
    alturaTotal += ALTURA_LINEA_REGULAR * sale.products.length;

    // Agregar altura de métodos de pago si existen
    if (sale.payment?.length) {
        alturaTotal += ALTURA_LINEA_LARGE; // Título
        alturaTotal += ALTURA_LINEA_REGULAR * sale.payment.length;
    }

    // Asegurar un mínimo y redondear hacia arriba
    return Math.ceil(alturaTotal);
}

/**
 * Genera el PDF del ticket con altura automática precisa
 */
function generarPDFTicket(sale) {
    return new Promise((resolve, reject) => {
        const alturaCalculada = calcularAlturaNecesaria(sale);
        const doc = new PDFDocument({
            size: [226, alturaCalculada],
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
        } catch (error) {
            // Si no hay logo, continuamos sin él
            logger.warn('Logo no encontrado, continuando sin él');
        }

        doc.fontSize(10).text('Eso Que Te Gusta', { align: 'center' });
        doc.fontSize(9).text('Oliva entre 14 de Mayo y 15 de Agosto', { align: 'center' });
        doc.fontSize(9).text('Tel: 0991 401621', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text('Comprobante de Pago', { align: 'center' });

        doc.fontSize(8).text(`RUC: ${sale.ruc}  Código: ${sale.dailyId} `); 
        doc.text(`${sale.customerName}`);
        doc.text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);
        doc.text(`Vendedor: ${sale.user?.name || '---'}  Consumo: ${translateMode[sale.mode]}`);

        doc.moveDown();
        doc.fontSize(10).text('Detalle:', { underline: true });

        sale.products.forEach(p => {
            const totalGs = p.totalPrice.toLocaleString("es-PY");
            doc.fontSize(9)
                .text(`${p.quantity} x ${p.name}`, { continued: true })
                .text(`${totalGs} Gs`, { align: 'right' });
        });

        doc.text('---------------------------------------------------------', { align: 'center' });

        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);
        doc.fontSize(8).text(`Subtotal: ${roundedSubtotal.toLocaleString("es-PY")} Gs    IVA 10%: ${sale.iva.toLocaleString("es-PY")} Gs`);
        doc.fontSize(10).text(`Total: ${sale.totalAmount.toLocaleString("es-PY")} Gs`);

        doc.text('---------------------------------------------------------', { align: 'center' });

        if (sale.payment?.length) {
            doc.fontSize(9).text('Método(s) de Pago:');
            sale.payment.forEach(p => {
                const metodo = {
                    cash: 'Efectivo',
                    card: 'Tarjeta',
                    qr: 'QR',
                    transfer: 'Transferencia'
                }[p.paymentMethod] || p.paymentMethod;

                doc.fontSize(8).text(`- ${metodo}: ${p.totalAmount.toLocaleString("es-PY")} Gs`);
            });
        }

        doc.moveDown();
        doc.fontSize(9).text('¡Gracias por su compra, vuelva pronto!', { align: 'center' });

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

export async function imprimirVenta(sale, printerName) {
    try {
        await generarPDFTicket(sale);
        await print(TICKET_PATH, {
            printer: printerName,
            silent: true
        });
        logger.info("Ticket enviado a la impresora");
    } catch (error) {
        logger.error('Error imprimiendo el ticket:', error.message);
        throw error;
    }
}