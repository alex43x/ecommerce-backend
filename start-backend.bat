@echo off
REM Navega a la carpeta donde está el docker-compose.yml
cd C:\Users\azufr\Desktop\Ecommerce

REM Levanta mongo y frontend en modo detached (en segundo plano)
docker-compose up -d

REM Espera 5 segundos para que Docker levante los servicios
timeout /t 5 /nobreak >nul

REM Navega a la carpeta del backend
cd C:\Users\azufr\Desktop\Ecommerce\backend

REM Abre una nueva ventana de consola y ejecuta el backend (npm run dev)
start cmd /k "npm run dev"

REM Mensaje final
echo Todos los servicios iniciados.
pause
