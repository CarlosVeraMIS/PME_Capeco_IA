const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Iniciando Puppeteer para Stories...');
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Scale Factor 6 x 200px (ancho original) = 1200px ancho real exportado
        // Esto mantiene las proporciones de letras e iconos intactos mientras da calidad 4K.
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 6 });

        const fileUrl = 'file:///' + path.join(__dirname, 'PME_LinkedIn_RRSS_Kit_2026.html').replace(/\\/g, '/');
        console.log('Cargando: ' + fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle2' });
        await page.evaluateHandle('document.fonts.ready');

        // Desactivamos box-shadow para que las stories queden planas como plantillas reales 
        // y el border-radius también para dejarlas totalmente rectangulares a 1080x1920
        await page.evaluate(() => {
            const storiesElements = document.querySelectorAll('.story-phone');
            storiesElements.forEach(s => {
                s.style.boxShadow = 'none';
                s.style.borderRadius = '0';
                // Removemos el notch negro simulado
                const notch = s.querySelector('.story-notch');
                if (notch) notch.style.display = 'none';
                // Removemos avatar de IG falso de arriba
                const fakeUI1 = s.querySelector('.story-bars');
                if (fakeUI1) fakeUI1.style.display = 'none';
                const fakeUI2 = s.querySelector('.story-avatar-row');
                if (fakeUI2) fakeUI2.style.display = 'none';
            });
        });

        const stories = await page.$$('.story-phone');
        console.log(`Encontradas ${stories.length} stories.`);
        
        for (let s = 0; s < Math.min(4, stories.length); s++) {
            const filePath = path.join(__dirname, `PME_Story_${s+1}.png`);
            await stories[s].screenshot({ path: filePath });
            console.log(`✅ Guardado: PME_Story_${s+1}.png`);
        }

        await browser.close();
        console.log('¡Las 4 Stories generadas con éxito!');
    } catch (error) {
        console.error('Error al generar stories:', error);
        process.exit(1);
    }
})();
