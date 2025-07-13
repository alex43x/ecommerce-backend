import PDFDocument from 'pdfkit';
import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
const { print } = pkg;

const TICKET_PATH = './ticket.pdf';

// Traducción del modo de venta
const translateMode = {
    local: 'En local',
    carry: 'Para llevar',
    delivery: 'Delivery'
};

// Formato de fecha a GMT-3

function restar3HorasYFormatear(fechaISO) {
    const fecha = new Date(fechaISO);
    fecha.setUTCHours(fecha.getUTCHours() - 3); // Restamos 3 horas EN UTC

    // Opciones para formatear en español, forzando UTC+0 (Zulu)
    const opciones = {
        timeZone: 'UTC', // Clave: mantener todo en UTC
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    return fecha.toLocaleString('es-ES', opciones);
}

// Ejemplo de uso:
const fechaOriginal = "2025-07-13T19:53:26.639Z";
const fechaLegible = restar3HorasYFormatear(fechaOriginal);
console.log(fechaLegible); // "13 de julio de 2025, 16:53:26"




/**
 * Genera el PDF del ticket de venta.
 * @param {Object} sale - Objeto venta completo
 * @returns {Promise<void>}
 */
function generarPDFTicket(sale) {
    console.log(sale.date)
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [220, 600], margin: 5 });
        const stream = fs.createWriteStream(TICKET_PATH);
        doc.pipe(stream);

        doc.fontSize(14).text('Eso Que Te Gusta', { align: 'center' });
        doc.fontSize(10).text('Oliva entre 14 de Mayo y 15 de Agosto', { align: 'center' });
        doc.fontSize(10).text('Tel: 0991 401621', { align: 'center' });
        doc.moveDown();

        doc.text('------------------------------------------------------', { align: 'center' });
        doc.fontSize(12).text('Comprobante de Pago', { align: 'center' });
        doc.fontSize(10).text('----------------------------------------------------', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(`RUC Cliente: ${sale.ruc}`);
        doc.fontSize(10).text(`${sale.customerName}`);
        doc.text(`Fecha: ${restar3HorasYFormatear(sale.date)}`);
        doc.text(`Código: ${sale._id}`);
        doc.text(`Vendedor: ${sale.user?.name || '---'}  Consumo:${translateMode[sale.mode] || sale.mode}`);
        doc.text('------------------------------------------------------', { align: 'center' });

        doc.moveDown();
        doc.fontSize(12).text('Detalle:', { underline: true });

        sale.products.forEach(p => {
            const totalGs = p.totalPrice.toLocaleString("es-PY");
            doc.fontSize(10).text(`${p.quantity} x ${p.name}`);
            doc.text(`${totalGs} Gs`, { align: 'right' });
        });
        doc.text('---------------------------------------------------------', { align: 'center' });

        doc.moveDown();
        const roundedSubtotal = Math.round(sale.totalAmount / 1.1);
        doc.fontSize(10).text(`Subtotal: ${roundedSubtotal.toLocaleString("es-PY")} Gs`, { align: 'left' });
        doc.text(`IVA 10%: ${sale.iva.toLocaleString("es-PY")} Gs`, { align: 'left' });
        doc.fontSize(12).text(`TOTAL: ${sale.totalAmount.toLocaleString("es-PY")} Gs`, { align: 'left' });

        doc.moveDown();
        doc.fontSize(10).text('----------------------------------------------------', { align: 'center' });

        if (sale.payment?.length) {
            doc.fontSize(11).text('Método(s) de Pago:');
            sale.payment.forEach(p => {
                const metodo = {
                    cash: 'Efectivo',
                    card: 'Tarjeta',
                    qr: 'QR',
                    transfer: 'Transferencia'
                }[p.paymentMethod] || p.paymentMethod;

                const monto = p.totalAmount.toLocaleString("es-PY");
                doc.fontSize(10).text(`- ${metodo}: ${monto} Gs`);
            });
        }

        doc.moveDown();
        doc.text('---------------------------------------------------------', { align: 'center' });
        doc.fontSize(11).text('¡Gracias por su compra, vuelva pronto!', { align: 'center' });
        doc.text('------------------------------------------------------', { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', reject);
    });
}

/**
 * Imprime la venta recibida: genera el PDF y envía a la impresora.
 * @param {Object} sale - Objeto de venta completo (con user poblado)
 * @param {string} printerName - Nombre exacto de la impresora
 */
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
        console.log(error)
        throw error;
    }
}
