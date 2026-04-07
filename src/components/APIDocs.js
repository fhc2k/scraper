"use client";

import React, { useState } from "react";
import {
	Code2,
	Copy,
	Check,
	ChevronDown,
	Zap,
	Shield,
	Clock,
} from "lucide-react";

const APIDocs = () => {
	const [copied, setCopied] = useState(null);
	const [activeTab, setActiveTab] = useState("curl");

	const copyToClipboard = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		setTimeout(() => setCopied(null), 2000);
	};

	const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const curlExample = `curl -X GET "${API_URL}/api/cep?fecha=06-04-2026&referencia=1234567&emisor=40012&receptor=40002&cuentaBeneficiaria=012345678901234567&monto=1500`;

	const jsExample = `const response = await fetch('/api/cep?' + new URLSearchParams({
		fecha: '06-04-2026',
		referencia: '1234567',
		emisor: '40012',        // BBVA
		receptor: '40002',      // BANAMEX
		cuentaBeneficiaria: '012345678901234567',
		monto: '1500'
		}));

		const data = await response.json();
		console.log(data);`;

	const pythonExample = `import requests

		params = {s
			"fecha": "06-04-2026",
			"referencia": "1234567",
			"emisor": "40012",
			"receptor": "40002",
			"cuentaBeneficiaria": "012345678901234567",
			"monto": "1500"
		}

		response = requests.get("${API_URL}/api/cep", params=params)
		print(response.json())`;

	const responseExample = `{
			"success": true,
			"message": "CEP recuperado exitosamente",
			"data": {
				"id_transaccion": "ABC123XYZ",
				"estado": "LIQUIDADO",
				"fecha_operacion": "2026-04-06",
				"clave_rastreo": "CEP1712444800000",
				"monto": "1500",
				"banco_emisor": "BBVA MÉXICO",
				"banco_receptor": "BANAMEX",
				"cuenta_beneficiario": "012345678901234567",
				"nombre_beneficiario": "JUAN PÉREZ",
				"numero_referencia": "1234567",
				"rfc_beneficiario": "JUAP900101XYZ",
				"rfc_ordenante": "EMP800101ABC",
				"concepto_pago": "PAGO DE SERVICIOS",
				"rawXml": "<?xml version=\\"1.0\\"...>",
				"pdfBase64": "JVBERi0xLjQK..."
			}
		}`;

	const errorExample = `{
		"success": false,
		"message": "Validación fallida",
		"errors": {
			"referencia": "La referencia es requerida",
			"emisor": "El banco emisor es requerido"
		}
	`;

	const tabs = [
		{ id: "curl", label: "cURL" },
		{ id: "js", label: "JavaScript" },
		{ id: "python", label: "Python" },
	];

	const codeMap = { curl: curlExample, js: jsExample, python: pythonExample };

	const params = [
		{
			name: "fecha",
			type: "string",
			required: true,
			desc: "Fecha de operación (DD-MM-YYYY)",
		},
		{
			name: "referencia",
			type: "string",
			required: true,
			desc: "Número de referencia o clave de rastreo",
		},
		{
			name: "emisor",
			type: "string",
			required: true,
			desc: "ID del banco emisor (código Banxico de 5 dígitos)",
		},
		{
			name: "receptor",
			type: "string",
			required: true,
			desc: "ID del banco receptor (código Banxico de 5 dígitos)",
		},
		{
			name: "cuentaBeneficiaria",
			type: "string",
			required: true,
			desc: "CLABE interbancaria (18 dígitos)",
		},
		{
			name: "monto",
			type: "string",
			required: true,
			desc: "Monto de la operación (sin comas)",
		},
	];

	return (
		<div className="w-full mt-16 sm:mt-20">
			{/* Section Header */}
			<div className="text-center mb-8 sm:mb-10">
				<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
					<Code2 size={12} />
					REST API
				</div>
				<h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
					Usa nuestra API
				</h3>
				<p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
					Integra la validación de CEP directamente en tus sistemas
					con nuestra API REST
				</p>
			</div>

			{/* Feature pills */}
			<div className="flex flex-wrap items-center justify-center gap-3 mb-8">
				{[
					{
						icon: Zap,
						text: "Respuesta rápida",
						color: "text-amber-400 bg-amber-500/10 border-amber-500/10",
					},
					{
						icon: Shield,
						text: "Validación incluida",
						color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10",
					},
					{
						icon: Clock,
						text: "Disponible 24/7",
						color: "text-blue-400 bg-blue-500/10 border-blue-500/10",
					},
				].map((pill) => (
					<div
						key={pill.text}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold ${pill.color}`}
					>
						<pill.icon size={12} />
						{pill.text}
					</div>
				))}
			</div>

			{/* Endpoint Card */}
			<div className="bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden">
				{/* Endpoint header */}
				<div className="px-4 sm:px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
					<span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wider w-fit">
						GET
					</span>
					<code className="text-sm text-white font-mono break-all">
						/api/cep
					</code>
					<span className="text-[10px] text-gray-500 font-medium">
						Consulta un CEP por parámetros
					</span>
				</div>

				{/* Parameters Table */}
				<div className="px-4 sm:px-6 py-5 border-b border-white/5">
					<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
						Parámetros
					</h4>
					<div className="space-y-2">
						{params.map((p) => (
							<div
								key={p.name}
								className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-white/[0.03] last:border-0"
							>
								<div className="flex items-center gap-2 sm:w-44 flex-shrink-0">
									<code className="text-xs text-blue-400 font-mono font-bold">
										{p.name}
									</code>
									{p.required && (
										<span className="text-[8px] font-black text-red-400 uppercase">
											req
										</span>
									)}
								</div>
								<span className="text-[10px] text-gray-600 font-mono sm:w-16 flex-shrink-0">
									{p.type}
								</span>
								<span className="text-[11px] text-gray-400">
									{p.desc}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Code Examples */}
				<div className="px-4 sm:px-6 py-5 border-b border-white/5">
					<div className="flex items-center justify-between mb-4">
						<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
							Ejemplo de Request
						</h4>
						<div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === tab.id
											? "bg-blue-500/20 text-blue-400"
											: "text-gray-500 hover:text-gray-300"
										}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>
					<div className="relative group">
						<pre className="bg-black/40 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 border border-white/5">
							<code>{codeMap[activeTab]}</code>
						</pre>
						<button
							onClick={() =>
								copyToClipboard(codeMap[activeTab], "request")
							}
							className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
						>
							{copied === "request" ? (
								<Check size={14} className="text-emerald-400" />
							) : (
								<Copy size={14} />
							)}
						</button>
					</div>
				</div>

				{/* Responses */}
				<div className="px-4 sm:px-6 py-5">
					<h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
						Respuestas
					</h4>

					<div className="space-y-4">
						{/* Success */}
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black">
									200
								</span>
								<span className="text-[11px] text-gray-400">
									Consulta exitosa
								</span>
							</div>
							<div className="relative group">
								<pre className="bg-black/40 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 border border-white/5">
									<code>{responseExample}</code>
								</pre>
								<button
									onClick={() =>
										copyToClipboard(
											responseExample,
											"success",
										)
									}
									className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
								>
									{copied === "success" ? (
										<Check
											size={14}
											className="text-emerald-400"
										/>
									) : (
										<Copy size={14} />
									)}
								</button>
							</div>
						</div>

						{/* Error */}
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-black">
									400
								</span>
								<span className="text-[11px] text-gray-400">
									Error de validación
								</span>
							</div>
							<div className="relative group">
								<pre className="bg-black/40 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 border border-white/5">
									<code>{errorExample}</code>
								</pre>
								<button
									onClick={() =>
										copyToClipboard(errorExample, "error")
									}
									className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
								>
									{copied === "error" ? (
										<Check
											size={14}
											className="text-emerald-400"
										/>
									) : (
										<Copy size={14} />
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default APIDocs;
