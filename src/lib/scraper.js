/**
 * Banxico CEP Scraper Service
 * Automates the retrieval of CEP data from the official portal.
 *
 * CAPTCHA is solved via the captchaSolver repository (strategy pattern).
 * Configure in .env:
 *   CAPTCHA_PROVIDER = "2captcha" | "capmonster" | "manual"
 *   TWOCAPTCHA_API_KEY = ...   (for 2captcha)
 *   CAPMONSTER_API_KEY = ...   (for capmonster)
 */
import { createCaptchaSolver, extractCaptchaImage } from './captchaSolver';

export async function scrapeCEP(queryData, captchaConfig = {}) {
  let browser;
  try {
    console.log('--- STARTING SCRAPER ---');

    const { default: puppeteer } = await import('puppeteer-extra');
    const { default: StealthPlugin } = await import('puppeteer-extra-plugin-stealth');

    try {
      const already = puppeteer.plugins && puppeteer.plugins.some(p => p.name === 'stealth');
      if (!already) puppeteer.use(StealthPlugin());
    } catch (e) {
      console.warn('Stealth plugin skipped:', e.message);
    }

    // Initialize CAPTCHA solver — UI config overrides .env
    const solver = createCaptchaSolver(captchaConfig);
    const isAutoMode = solver.name !== 'manual';
    console.log(`CAPTCHA Provider: ${solver.name} ${isAutoMode ? '🤖' : '👤'}`);

    browser = await puppeteer.launch({
      headless: isAutoMode ? true : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // ── Step 1: Navigate ──
    console.log('[1/6] Navigating to Banxico...');
    await page.goto('https://www.banxico.org.mx/cep/', { waitUntil: 'networkidle2' });

    // ── Step 2: Fill the Form ──
    console.log('[2/6] Filling form...');

    await page.waitForSelector('#input_fecha');
    await page.evaluate((fecha) => {
      document.querySelector('#input_fecha').value = fecha;
    }, queryData.fecha);

    await page.select('#input_tipoCriterio', 'T');
    await page.waitForSelector('#input_criterio');
    await page.type('#input_criterio', queryData.referencia);

    await page.select('#input_emisor', queryData.emisor);
    await page.select('#input_receptor', queryData.receptor);

    await page.type('#input_cuenta', queryData.cuentaBeneficiaria.replace(/\s/g, ''));
    await page.type('#input_monto', queryData.monto.toString().replace(/,/g, ''));

    // ── Step 3: Force CAPTCHA visible ──
    console.log('[3/6] Showing CAPTCHA...');
    await page.evaluate(() => {
      const captchaDiv = document.querySelector('#captchaImage');
      if (captchaDiv) {
        captchaDiv.classList.remove('oculta');
        captchaDiv.style.display = 'block';
      }
      const captchaInputDiv = document.querySelector('#input_captcha')?.parentElement;
      if (captchaInputDiv) {
        captchaInputDiv.classList.remove('oculta');
        captchaInputDiv.style.display = 'block';
      }
    });

    // Reload CAPTCHA image
    await page.evaluate(() => {
      const btn = document.querySelector('#btn_ReloadCaptcha');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // ── Step 4: Solve CAPTCHA ──
    console.log('[4/6] Solving CAPTCHA...');

    if (isAutoMode) {
      // AUTO: extract image → send to provider → type solution
      const base64 = await extractCaptchaImage(page);
      const solution = await solver.solve(base64);

      if (!solution) {
        return { success: false, error: `${solver.name}: No pudo resolver el CAPTCHA` };
      }

      await page.type('#input_captcha', solution);
      console.log(`       → Solved: "${solution}"`);
    } else {
      // MANUAL: user solves in browser
      console.log('       → Solve the CAPTCHA in the browser window');
      await page.evaluate(() => {
        const img = document.querySelector('#img_captcha');
        if (img) img.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      await page.waitForFunction(() => {
        const input = document.querySelector('#input_captcha');
        return input && input.value && input.value.length >= 4;
      }, { timeout: 120000 });
    }

    // ── Step 5: Submit ──
    console.log('[5/6] Submitting...');
    await page.evaluate(() => {
      const btn = document.querySelector('#btn_Descargar');
      if (btn) btn.classList.remove('disabled');
    });
    await page.click('#btn_Descargar');

    // ── Step 6: Wait for results or errors ──
    console.log('[6/6] Waiting for results...');

    const outcome = await Promise.race([
      page.waitForSelector('.msg-banxico .boton-descarga-xml', { timeout: 45000 }).then(() => 'success'),
      page.waitForSelector('.mensajeError, .error, .alert-danger, #mensajeError', { visible: true, timeout: 45000 }).then(() => 'error'),
      page.waitForFunction(() => {
        const dialog = document.querySelector('.ui-dialog:not([style*="display: none"])');
        // Banxico sometimes shows errors in jQuery UI dialogs
        return dialog && dialog.innerText && dialog.innerText.toLowerCase().includes('error');
      }, { timeout: 45000 }).then(() => 'dialog_error'),
    ]).catch(() => 'timeout');

    if (outcome === 'error' || outcome === 'dialog_error') {
      const errorMsg = await page.evaluate(() => {
        const errorEl = document.querySelector('.mensajeError, .error, .alert-danger, #mensajeError');
        if (errorEl && errorEl.innerText) return errorEl.innerText.trim();
        const dialog = document.querySelector('.ui-dialog:not([style*="display: none"]) .ui-dialog-content');
        if (dialog && dialog.innerText) return dialog.innerText.trim();
        return 'Error del portal de Banxico';
      });
      return { success: false, error: `Banxico: ${errorMsg}` };
    }

    if (outcome === 'timeout') {
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('no se encontr') || bodyText.includes('No existe')) {
        return { success: false, error: 'No se encontró información del CEP.' };
      }
      return { success: false, error: 'Tiempo de espera agotado. Verifica el CAPTCHA o los datos.' };
    }

    // ── Step 7: Final Data Extraction via XML ──
    console.log('Success popup detected! Fetching and parsing XML data directly...');

    const extraction = await page.evaluate(async () => {
      try {
        const res = await fetch('descarga.do?formato=XML');
        if (!res.ok) return { error: `HTTP ${res.status}` };
        
        const xmlText = await res.text();
        
        let pdfBase64 = null;
        try {
          const resPdf = await fetch('descarga.do?formato=PDF');
          if (resPdf.ok) {
            const blob = await resPdf.blob();
            pdfBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) {}

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Helper to safely get attribute from the first element of a given tag
        const getAttr = (tag, attr) => {
          const el = xmlDoc.getElementsByTagName(tag)[0];
          return el ? (el.getAttribute(attr) || '') : '';
        };

        const rawMonto = getAttr('Beneficiario', 'MontoPago');
        const cleanMonto = rawMonto ? parseFloat(rawMonto).toString() : '';

        return {
          data: {
            id_transaccion: getAttr('SPEI_Tercero', 'claveRastreo') || 'N/A', // Using claveRastreo as ID conceptually
            estado: 'LIQUIDADO', // If there's an XML, it's liquidado
            fecha_operacion: getAttr('SPEI_Tercero', 'FechaOperacion'),
            clave_rastreo: getAttr('SPEI_Tercero', 'claveRastreo'),
            monto: cleanMonto,
            banco_emisor: getAttr('Ordenante', 'BancoEmisor'),
            banco_receptor: getAttr('Beneficiario', 'BancoReceptor'),
            cuenta_beneficiario: getAttr('Beneficiario', 'Cuenta'),
            nombre_beneficiario: getAttr('Beneficiario', 'Nombre'),
            numero_referencia: getAttr('SPEI_Tercero', 'claveRastreo'), // Fallback
            rfc_beneficiario: getAttr('Beneficiario', 'RFC'),
            rfc_ordenante: getAttr('Ordenante', 'RFC'),
            concepto_pago: getAttr('Beneficiario', 'Concepto'),
            rawXml: xmlText,
            pdfBase64: pdfBase64,
          }
        };
      } catch (err) {
        return { error: err.message };
      }
    });

    if (extraction.error || !extraction.data) {
      return { success: false, error: `Error extrayendo datos XML: ${extraction.error || 'Desconocido'}` };
    }

    console.log('--- SCRAPER COMPLETE ---');
    return { success: true, data: extraction.data };

  } catch (error) {
    console.error('Scraper Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      // await browser.close();
    }
  }
}
