const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Iniciando Puppeteer para carruseles...');
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });

        const fileUrl = 'file:///' + path.join(__dirname, 'PME_LinkedIn_RRSS_Kit_2026.html').replace(/\\/g, '/');
        console.log('Cargando: ' + fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle2' });
        await page.evaluateHandle('document.fonts.ready');

        // Desactivamos el scroll horizontal para que Puppeteer pueda hacer screenshot 
        // de todos los slides sin problemas de clipping o snap
        await page.evaluate(() => {
            const containers = document.querySelectorAll('.carousel-slides');
            containers.forEach(c => {
                c.style.display = 'block';
                c.style.overflow = 'visible';
            });
            const slides = document.querySelectorAll('.c-slide');
            slides.forEach(s => {
                s.style.marginBottom = '20px'; // separamos un poco para evitar overlaps
            });
        });

        const carousels = ['car1', 'car2', 'car3'];
        for (let c = 0; c < carousels.length; c++) {
            const carouselId = carousels[c];
            const slides = await page.$$(`#${carouselId} .c-slide-img`);
            console.log(`Encontrados ${slides.length} slides en el carrusel ${c+1}.`);
            
            for (let s = 0; s < slides.length; s++) {
                const filePath = path.join(__dirname, `PME_Carrusel_${c+1}_Slide_${s+1}.png`);
                await slides[s].screenshot({ path: filePath });
                console.log(`✅ Guardado: PME_Carrusel_${c+1}_Slide_${s+1}.png`);
            }
        }

        await browser.close();
        console.log('¡Todos los carruseles (18 slides) generados correctamente!');
    } catch (error) {
        console.error('Error al generar carruseles:', error);
        process.exit(1);
    }
})();
