const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Iniciando Puppeteer...');
        // Opciones por defecto para evitar problemas en windows
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Setear factor de escala alto para obtener PNGs nítidos (simulando 1080x1080 o superior)
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });

        const fileUrl = 'file:///' + path.join(__dirname, 'PME_LinkedIn_RRSS_Kit_2026.html').replace(/\\/g, '/');
        console.log('Cargando: ' + fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle2' });

        // Esperar a que las fuentes web (Google Fonts) terminen de cargar para no tener saltos tipográficos
        await page.evaluateHandle('document.fonts.ready');

        // Seleccionar todos los gráficos cuadrados internos
        const graficos = await page.$$('.post-image');
        for (let i = 0; i < Math.min(5, graficos.length); i++) {
            const filePath = path.join(__dirname, `PME_Plantilla_${i+1}_Grafico.png`);
            await graficos[i].screenshot({ path: filePath });
            console.log(`✅ Guardado: PME_Plantilla_${i+1}_Grafico.png`);
        }

        // Seleccionar también el mockup completo del post de LinkedIn
        const mockups = await page.$$('.post-phone');
        for (let i = 0; i < Math.min(5, mockups.length); i++) {
            const filePath = path.join(__dirname, `PME_Plantilla_${i+1}_Mockup.png`);
            await mockups[i].screenshot({ path: filePath });
            console.log(`✅ Guardado: PME_Plantilla_${i+1}_Mockup.png`);
        }

        await browser.close();
        console.log('¡Todas las imágenes generadas correctamente!');
    } catch (error) {
        console.error('Error al generar imágenes:', error);
        process.exit(1);
    }
})();
