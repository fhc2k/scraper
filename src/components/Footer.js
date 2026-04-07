"use client";

import React from "react";
import { Shield, ExternalLink } from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/5 bg-[#050505]/80 backdrop-blur-md mt-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex flex-col items-center sm:flex-row sm:justify-between gap-3 sm:gap-4">
                    {/* Left */}
                    <div className="flex items-center gap-2 text-gray-500">
                        <Shield size={14} className="text-blue-500" />
                        <span className="text-xs font-medium">
                            CEP Validator · Consulta y validación de pagos SPEI
                        </span>
                    </div>

                    {/* Center */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-gray-600">
                        <a
                            href="https://www.banxico.org.mx/cep/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                            Portal Banxico
                            <ExternalLink size={10} />
                        </a>
                        <span className="text-gray-700">·</span>
                        <span>Datos proporcionados por Banco de México</span>
                    </div>

                    {/* Right */}
                    <p className="text-[11px] text-gray-600 font-medium">
                        © {currentYear}
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-gray-700 text-center leading-relaxed max-w-3xl mx-auto">
                        Los Comprobantes Electrónicos de Pago se generan con
                        base en la información proporcionada por las entidades
                        receptoras de los pagos bajo su responsabilidad
                        exclusiva. Esta herramienta es un facilitador de
                        consulta y no sustituye la verificación oficial.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
