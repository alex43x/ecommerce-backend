import fs from 'fs';
import pkg from 'pdf-to-printer';
import logger from '../config/logger.js';
import http from 'http';
import https from 'https';

const { print } = pkg;

const TEMP_FACTURA_PATH = './factura.pdf';

/**
 * Imprime factura fiscal en impresora térmica 80mm
 * El largo se corta automáticamente al finalizar el documento
 */
export function imprimirFacturaDesdeURL(url, printerName) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(TEMP_FACTURA_PATH);

        protocol
            .get(url, response => {
                if (response.statusCode !== 200) {
                    return reject(
                        new Error(`Error descargando factura: ${response.statusCode}`)
                    );
                }

                response.pipe(file);

                file.on('finish', async () => {
                    file.close();

                    try {
                        await print(TEMP_FACTURA_PATH, {
                            printer: 'MP-4200 TH',
                            silent: true,
                            paperSize: 'Print width 80mm 30cm', // 👈 nombre exacto del papel
                            scale: 'noscale', // mantiene tamaño real
                            printDialog: true
                        });


                        logger.info('Factura impresa correctamente', {
                            url,
                            printer: printerName,
                            paper: '80mm continuo'
                        });

                        resolve();
                    } catch (err) {
                        reject(
                            err instanceof Error
                                ? err
                                : new Error('Error desconocido al imprimir factura')
                        );
                    } finally {
                        if (fs.existsSync(TEMP_FACTURA_PATH)) {
                            fs.unlinkSync(TEMP_FACTURA_PATH);
                        }
                    }
                });
            })
            .on('error', err => {
                if (fs.existsSync(TEMP_FACTURA_PATH)) {
                    fs.unlinkSync(TEMP_FACTURA_PATH);
                }

                logger.error('Error descargando factura', {
                    error: err.message,
                    url
                });

                reject(err);
            });
    });
}
