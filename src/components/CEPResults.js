'use client';

import React from 'react';
import {
  CheckCircle,
  Info,
  ArrowLeft,
  Download,
  ExternalLink,
  ShieldCheck,
  Printer,
  Share2,
  FileText,
  BadgeCheck,
  Building2,
  User2,
  Calendar,
  Hash,
  DollarSign,
  FileCode,
  FileJson,
  FilePieChart,
  User
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

const DetailRow = ({ label, value, highlight }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-4">
    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">{label}</span>
    <span className={cn(
      "text-xs font-medium tracking-tight break-all sm:truncate",
      highlight ? "text-blue-400 font-mono" : "text-white/80"
    )}>
      {value || '---'}
    </span>
  </div>
);

const ChevronRight = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const CEPResults = ({ data, onBack }) => {
  const [currentDate, setCurrentDate] = React.useState('');
  const qrRef = React.useRef(null);

  React.useEffect(() => {
    setCurrentDate(new Date().toLocaleString('es-MX'));
  }, []);

  const downloadOptions = [
    { label: 'PDF Report', type: 'PDF', icon: FileText, color: 'text-red-400' },
    { label: 'XML Data', type: 'XML', icon: FileCode, color: 'text-amber-400' },
    { label: 'JSON Export', type: 'JSON', icon: FileJson, color: 'text-blue-400' },
  ];

  const handleDownload = (type) => {
    let content, mime, filename;
    const baseFilename = `CEP-${data.id_transaccion || 'Comprobante'}`;

    if (type === 'XML') {
      if (!data.rawXml) return alert('El XML original no está disponible.');
      content = data.rawXml;
      mime = 'application/xml';
      filename = `${baseFilename}.xml`;
    } else if (type === 'JSON') {
      // Omit raw data from JSON export to keep it clean
      const { rawXml, pdfBase64, ...cleanData } = data;
      content = JSON.stringify(cleanData, null, 2);
      mime = 'application/json';
      filename = `${baseFilename}.json`;
    } else if (type === 'PDF') {
      if (!data.pdfBase64) return alert('El PDF original de Banxico no está disponible.');
      // Convert base64 to binary ArrayBuffer, then to Blob
      const binaryRaw = window.atob(data.pdfBase64);
      const array = new Uint8Array(new ArrayBuffer(binaryRaw.length));
      for (let i = 0; i < binaryRaw.length; i++) array[i] = binaryRaw.charCodeAt(i);
      const blob = new Blob([array], { type: 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${baseFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Handle string content downloads (XML/JSON)
    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const qrValue = `https://cep.banxico.org.mx/consulta?id=${data.id_transaccion || 'MOCK'}`;

  const handlePrint = () => {
    const qrImage = qrRef.current ? qrRef.current.toDataURL("image/png") : '';
    const printWindow = window.open('', '_blank');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CEP - ${data.id_transaccion}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #111; 
              margin: 40px;
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              border-bottom: 2px solid #eee;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .badge {
              background: #ecfdf5;
              color: #059669;
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .amount-box {
              text-align: center;
              padding: 40px 0;
              background: #f9fafb;
              border-radius: 20px;
              margin-bottom: 40px;
            }
            .amount-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.2em; }
            .amount-value { font-size: 48px; font-weight: 800; color: #000; margin: 10px 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            @media (max-width: 600px) { .grid { grid-template-columns: 1fr; gap: 20px; } .amount-value { font-size: 32px; } body { margin: 20px; } }
            .section-title { 
              font-size: 11px; 
              font-weight: 800; 
              text-transform: uppercase; 
              color: #999; 
              letter-spacing: 0.1em; 
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
            .label { color: #666; font-weight: 500; }
            .value { color: #000; font-weight: 600; text-align: right; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #999; }
            .qr-container { text-align: center; margin-top: 30px; }
            .qr-image { width: 120px; height: 120px; }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="badge">Validación SPEI Banxico</div>
              <h1 style="font-size: 24px; margin: 10px 0;">Comprobante Electrónico de Pago</h1>
              <p style="font-size: 12px; color: #666;">Serie ID: <strong># ${data.id_transaccion}</strong></p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase;">Emisión</p>
              <p style="font-size: 14px; font-weight: 600;">${currentDate}</p>
            </div>
          </div>

          <div class="amount-box">
             <div class="amount-label">Importe Liquidado</div>
             <div class="amount-value">$ ${parseFloat(data.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
             <div style="font-size: 11px; color: #666;">Operación procesada mediante el Sistema de Pagos Electrónicos Interbancarios</div>
          </div>

          <div class="grid">
            <div>
              <div class="section-title">Información del Ordenante</div>
              <div class="row"><div class="label">Institución</div><div class="value">${data.banco_emisor}</div></div>
              <div class="row"><div class="label">RFC</div><div class="value">${data.rfc_ordenante}</div></div>
              <div class="row"><div class="label">Referencia Numérica</div><div class="value">${data.numero_referencia}</div></div>
              <div class="row"><div class="label">Concepto</div><div class="value">${data.concepto_pago}</div></div>
            </div>
            <div>
              <div class="section-title">Información del Beneficiario</div>
              <div class="row"><div class="label">Institución</div><div class="value">${data.banco_receptor}</div></div>
              <div class="row"><div class="label">Titular</div><div class="value">${data.nombre_beneficiario}</div></div>
              <div class="row"><div class="label">RFC</div><div class="value">${data.rfc_beneficiario}</div></div>
              <div class="row"><div class="label">Cuenta CLABE</div><div class="value" style="font-family: monospace;">${data.cuenta_beneficiario}</div></div>
            </div>
          </div>

          <div class="qr-container">
            <p style="font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 15px;">Verificación de Seguridad</p>
            <img src="${qrImage}" class="qr-image" />
            <p style="font-size: 9px; color: #999; margin-top: 10px;">ID UNICO: ${data.id_transaccion}</p>
          </div>

          <div class="footer">
            <p>Este documento es una representación impresa de un comprobante electrónico de pago (CEP) emitido por el Banco de México. Los datos presentados tienen carácter informativo y su validez puede ser consultada en el portal oficial de Banxico utilizando el folio de serie proporcionado.</p>
            <p style="margin-top: 10px; font-family: monospace; font-size: 9px;">CADENA ORIGINAL: |${data.id_transaccion}|${data.referencia}|${data.monto}|${Date.now()}|</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              // window.close(); // Optional: close window after printing
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 px-2 sm:px-0">
      {/* Top Actions */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Volver al formulario</span>
          <span className="sm:hidden">Volver</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-sm"
          >
            <Printer size={16} />
          </button>
          <button className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-sm">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Report Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">

        {/* Left Column: Main Report */}
        <div className="lg:col-span-2">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl relative h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="px-4 sm:px-8 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b border-white/5 shrink-0">
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl flex-shrink-0">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 sm:mb-2">
                    <BadgeCheck size={14} />
                    <span>Transacción Exitosa</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-2 sm:mb-3">Comprobante de Pago</h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-500" /> Banxico SPEI</span>
                    <span className="hidden sm:block w-1 h-1 bg-gray-700 rounded-full" />
                    <span>Serie: <span className="text-gray-300 font-mono">#{data.id_transaccion}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-10">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-2">Importe Liquidado</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-white tracking-tighter">$ {parseFloat(data.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  <span className="text-sm sm:text-lg font-bold text-gray-600 mt-1 sm:mt-2">MXN</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-8">
                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-2">
                    <Building2 size={14} className="text-blue-500" />
                    Información de la Operación
                  </div>
                  <DetailRow label="Banco Ordenante" value={data.banco_emisor} />
                  <DetailRow label="RFC Ordenante" value={data.rfc_ordenante} />
                  <DetailRow label="Concepto de Pago" value={data.concepto_pago} />
                  <DetailRow label="Clave de Rastreo" value={data.clave_rastreo} />

                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3 mb-2 mt-4">
                    <User size={14} className="text-blue-500" />
                    Beneficiario
                  </div>
                  <DetailRow label="Banco Receptor" value={data.banco_receptor} />
                  <DetailRow label="Titular" value={data.nombre_beneficiario} />
                  <DetailRow label="RFC Beneficiario" value={data.rfc_beneficiario} />
                  <DetailRow label="Cuenta CLABE" value={data.cuenta_beneficiario} highlight />
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-8 py-4 sm:py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[8px] sm:text-[9px] text-gray-600 font-mono truncate">
                HASH: {Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}
              </div>
              <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                Verificar <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Downloads & QR */}
        <div className="space-y-6">
          {/* Quick Downloads Card */}
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <Download size={16} className="text-blue-500" />
              Opciones de Descarga
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
              {downloadOptions.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleDownload(opt.type)}
                  className="w-full group flex flex-col lg:flex-row items-center lg:justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-center lg:text-left gap-2"
                >
                  <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3">
                    <div className={cn("p-2 rounded-lg bg-black/40", opt.color)}>
                      <opt.icon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-bold text-white">{opt.label}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-500 hidden lg:block">Documento oficial</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors hidden lg:block" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Verification QR Card (Disabled por ahora) */}
          {/*
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-blue-900/20 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-3 sm:mb-4">Verificación Rápida</p>
              <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl inline-block shadow-2xl mb-4 sm:mb-6 transform group-hover:scale-105 transition-transform duration-500">
                <QRCodeCanvas
                  ref={qrRef}
                  value={qrValue}
                  size={110}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-tight">Acceso Directo <br /> SPEI Banxico</h4>
              <p className="text-[10px] text-white/50 mt-2 sm:mt-3 font-mono break-all">ID: {data.id_transaccion}</p>
            </div>

            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full" />
              <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-white rounded-full" />
            </div>
          </div>
          */}
        </div>

      </div>
    </div>
  );
};

export default CEPResults;
