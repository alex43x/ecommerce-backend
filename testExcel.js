// test-export.js
import http from 'http';
import fs from 'fs';

const url = 'http://localhost:5000/api/sales/export?startDate=2025-12-01&endDate=2025-12-15';

console.log('Iniciando descarga...');

http.get(url, (response) => {
  console.log('Status:', response.statusCode);
  console.log('Headers:', response.headers);

  if (response.statusCode !== 200) {
    console.error('Error en la respuesta');
    response.on('data', (chunk) => console.log(chunk.toString()));
    return;
  }

  const fileStream = fs.createWriteStream('ventas_test.xlsx');
  
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('✓ Archivo descargado');
  });

  fileStream.on('error', (err) => {
    console.error('✗ Error al escribir:', err);
  });
});