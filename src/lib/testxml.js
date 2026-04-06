const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SPEI_Tercero FechaOperacion="2025-07-28" Hora="12:41:47" ClaveSPEI="40012" sello="..." numeroCertificado="00001000000511796968" cadenaCDA="..." claveRastreo="UNALANAPAY0108134302">
    <Beneficiario BancoReceptor="BBVA BANCOMER" Nombre="CUAUHTEMOC EDUARDO CORTES SANCHEZ" TipoCuenta="40" Cuenta="012180011439369374" RFC="COSC921003CH8" Concepto="PAGO NOMINA" IVA="000000000000000.00" MontoPago="000000000050000.00"/>
    <Ordenante BancoEmisor="KUSPIT" Nombre="PREMIER PEAK SC 3" TipoCuenta="40" Cuenta="653180003810183753" RFC="PPE190502675"/>
</SPEI_Tercero>`;

const getAttr = (xml, tag, attr) => {
  const regex = new RegExp(`<${tag}[^>]*\\s+${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
};

console.log('ID:', getAttr(xml, 'SPEI_Tercero', 'claveRastreo'));
console.log('Fecha:', getAttr(xml, 'SPEI_Tercero', 'FechaOperacion'));
console.log('Monto:', getAttr(xml, 'Beneficiario', 'MontoPago'));
console.log('RFC:', getAttr(xml, 'Ordenante', 'RFC'));
