import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { cepSchema } from "@/lib/validation";
import {
	Calendar,
	Hash,
	Building2,
	User,
	CreditCard,
	DollarSign,
	ChevronRight,
	AlertCircle,
	ChevronDown,
	Key,
	Bot,
	Settings2,
	ShieldCheck,
} from "lucide-react";
import { MEXICAN_BANKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CEPForm = ({ onSubmit }) => {
	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: yupResolver(cepSchema),
		defaultValues: {
			fecha: "2025-07-28",
			referencia: "UNALANAPAY0108134302",
			emisor: "90653", // KUSPIT
			receptor: "40012", // BBVA MEXICO
			cuentaBeneficiaria: "0121 8001 1439 3693 74",
			monto: "50000",
		},
	});

	const formatCurrency = (value) => {
		if (!value) return "";
		// Strip everything except digits
		return value.replace(/[^0-9]/g, "");
	};

	const formatCLABE = (value) => {
		const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
		const matches = v.match(/\d{4,18}/g);
		const match = (matches && matches[0]) || "";
		const parts = [];

		for (let i = 0, len = match.length; i < len; i += 4) {
			parts.push(match.substring(i, i + 4));
		}

		if (parts.length) {
			return parts.join(" ");
		} else {
			return v;
		}
	};

	// If backend config is explicitly defined via NEXT_PUBLIC_ flag, we hide this from the user
	const hasServerProvider =
		process.env.NEXT_PUBLIC_HAS_SERVER_CAPTCHA === "true";

	const [showCaptchaConfig, setShowCaptchaConfig] = useState(false);
	const [captchaProvider, setCaptchaProvider] = useState("manual");
	const [captchaApiKey, setCaptchaApiKey] = useState("");

	const onFormSubmit = (data) => {
		// Only enforce validation if the UI block is active
		if (
			!hasServerProvider &&
			captchaProvider !== "manual" &&
			!captchaApiKey.trim()
		) {
			setShowCaptchaConfig(true);
			toast.error("API Key requerida", {
				description: `Ingresa tu API key de ${captchaProvider} o selecciona el modo Manual.`,
			});
			return;
		}

		const [y, m, d] = data.fecha.split("-");
		const formattedData = {
			...data,
			fecha: `${d}-${m}-${y}`,
			cuentaBeneficiaria: data.cuentaBeneficiaria.replace(/\s/g, ""),
			monto: data.monto.replace(/[^0-9]/g, ""),
			// Only inject UI keys if the server doesn't override it centrally
			...(!hasServerProvider
				? {
					captchaProvider,
					...(captchaApiKey ? { captchaApiKey } : {}),
				}
				: {}),
		};
		onSubmit(formattedData);
	};

	const InputField = ({
		label,
		name,
		icon: Icon,
		type = "text",
		placeholder,
		children,
	}) => (
		<div className="relative mb-6">
			<label
				className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider"
				htmlFor={name}
			>
				{label}
			</label>
			<div className="relative group">
				<div
					className={cn(
						"absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors z-10",
						errors[name]
							? "text-red-500"
							: "group-focus-within:text-blue-400 text-gray-500",
					)}
				>
					<Icon size={18} strokeWidth={2} />
				</div>
				{children || (
					<input
						id={name}
						type={type}
						{...register(name)}
						placeholder={placeholder}
						className={cn(
							"block w-full pl-11 pr-4 py-3.5 bg-[#0f1115] border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-600 appearance-none shadow-sm",
							errors[name]
								? "border-red-500/50 focus:bg-[#151010] focus:ring-4 focus:ring-red-500/10"
								: "border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:bg-[#13151a] focus:ring-4 focus:ring-blue-500/10",
							type === "date" && "block",
						)}
						style={type === "date" ? { colorScheme: "dark" } : {}}
					/>
				)}
			</div>
			{errors[name] && (
				<p className="mt-2 ml-1 text-[11px] font-medium text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
					<AlertCircle size={12} strokeWidth={2.5} />
					{errors[name]?.message}
				</p>
			)}
		</div>
	);

	return (
		<div className="w-full bg-[#0a0c10] border border-white/5 rounded-2xl p-5 sm:p-8 lg:p-10 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
			{/* Subtle background glow */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
			<div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

			<div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
				<div>
					<h2 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
						Validación CEP
					</h2>
					<p className="text-sm text-gray-500 mt-1.5 font-medium">
						Sistema de Verificación Interbancaria en Tiempo Real
					</p>
				</div>
				<div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner flex-shrink-0">
					<ShieldCheck size={24} strokeWidth={2} />
				</div>
			</div>

			<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 relative z-10">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
					<InputField
						label="Fecha de Operación"
						name="fecha"
						icon={Calendar}
						type="date"
					/>
					<InputField
						label="Número de Referencia"
						name="referencia"
						icon={Hash}
						placeholder="Ej: 1234567"
					/>
					<div className="md:col-span-1">
						<InputField
							label="Banco Emisor"
							name="emisor"
							icon={Building2}
						>
							<select
								{...register("emisor")}
								id="emisor"
								className={cn(
									"block w-full pl-11 pr-4 py-3.5 bg-[#0f1115] border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-600 appearance-none shadow-sm",
									errors.emisor
										? "border-red-500/50 focus:bg-[#151010] focus:ring-4 focus:ring-red-500/10"
										: "border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:bg-[#13151a] focus:ring-4 focus:ring-blue-500/10",
								)}
								style={{ colorScheme: "dark" }}
							>
								<option value="" className="bg-[#0a0a0a]">
									Seleccionar banco...
								</option>
								{MEXICAN_BANKS.map((bank) => (
									<option
										key={bank.id}
										value={bank.id}
										className="bg-[#0a0a0a]"
									>
										{bank.name}
									</option>
								))}
							</select>
						</InputField>
					</div>
					<div className="md:col-span-1">
						<InputField
							label="Banco Receptor"
							name="receptor"
							icon={Building2}
						>
							<select
								{...register("receptor")}
								id="receptor"
								className={cn(
									"block w-full pl-11 pr-4 py-3.5 bg-[#0f1115] border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-600 appearance-none shadow-sm",
									errors.receptor
										? "border-red-500/50 focus:bg-[#151010] focus:ring-4 focus:ring-red-500/10"
										: "border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:bg-[#13151a] focus:ring-4 focus:ring-blue-500/10",
								)}
								style={{ colorScheme: "dark" }}
							>
								<option value="" className="bg-[#0a0a0a]">
									Seleccionar banco...
								</option>
								{MEXICAN_BANKS.map((bank) => (
									<option
										key={bank.id}
										value={bank.id}
										className="bg-[#0a0a0a]"
									>
										{bank.name}
									</option>
								))}
							</select>
						</InputField>
					</div>
					<div className="md:col-span-2">
						<Controller
							name="cuentaBeneficiaria"
							control={control}
							render={({ field }) => (
								<InputField
									label="Cuenta CLABE Beneficiaria"
									name="cuentaBeneficiaria"
									icon={CreditCard}
									placeholder="0000 0000 0000 0000 00"
								>
									<input
										{...field}
										id="cuentaBeneficiaria"
										type="text"
										onChange={(e) => {
											const formatted = formatCLABE(
												e.target.value,
											);
											field.onChange(formatted);
										}}
										className={cn(
											"block w-full pl-11 pr-4 py-3.5 bg-[#0f1115] border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-600 appearance-none shadow-sm font-mono tracking-wider",
											errors.cuentaBeneficiaria
												? "border-red-500/50 focus:bg-[#151010] focus:ring-4 focus:ring-red-500/10"
												: "border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:bg-[#13151a] focus:ring-4 focus:ring-blue-500/10",
										)}
									/>
								</InputField>
							)}
						/>
					</div>
					<div className="md:col-span-2">
						<Controller
							name="monto"
							control={control}
							render={({ field }) => (
								<InputField
									label="Monto de la Operación"
									name="monto"
									icon={DollarSign}
									placeholder="0.00 MXN"
								>
									<div className="relative flex-1">
										<input
											{...field}
											id="monto"
											type="text"
											onChange={(e) => {
												const formatted =
													formatCurrency(
														e.target.value,
													);
												field.onChange(formatted);
											}}
											className={cn(
												"block w-full pl-11 pr-12 py-3.5 bg-[#0f1115] border rounded-xl outline-none transition-all duration-300 text-white placeholder-gray-600 appearance-none shadow-sm font-mono tracking-wider",
												errors.monto
													? "border-red-500/50 focus:bg-[#151010] focus:ring-4 focus:ring-red-500/10"
													: "border-white/5 hover:border-white/10 focus:border-blue-500/50 focus:bg-[#13151a] focus:ring-4 focus:ring-blue-500/10",
											)}
										/>
										<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 text-xs font-bold uppercase tracking-widest">
											MXN
										</div>
									</div>
								</InputField>
							)}
						/>
					</div>
				</div>

				{/* CAPTCHA Config (Conditionally Hidden) */}
				{!hasServerProvider && (
					<div className="border border-white/5 rounded-xl overflow-hidden">
						<button
							type="button"
							onClick={() =>
								setShowCaptchaConfig(!showCaptchaConfig)
							}
							className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-white/5 transition-colors group"
						>
							<div className="flex items-center gap-2.5">
								<Settings2
									size={16}
									className="text-gray-500 group-hover:text-blue-400 transition-colors"
								/>
								<div>
									<span className="text-xs font-bold text-gray-400">
										Configuración CAPTCHA
									</span>
									<span className="text-[10px] text-gray-600 ml-2">
										{captchaProvider === "manual"
											? "(Manual — sin API key)"
											: `(${captchaProvider})`}
									</span>
								</div>
							</div>
							<ChevronDown
								size={14}
								className={`text-gray-600 transition-transform duration-200 ${showCaptchaConfig ? "rotate-180" : ""}`}
							/>
						</button>

						{showCaptchaConfig && (
							<div className="px-3 sm:px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
								<div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
									<p className="text-[11px] text-blue-300/80 leading-relaxed">
										<strong className="text-blue-400">
											Modo Manual (por defecto):
										</strong>{" "}
										Se abre un navegador, se llena el
										formulario automáticamente y tú
										resuelves el CAPTCHA visualmente. Si
										tienes una API key de un servicio de
										resolución, ingrésala abajo para
										automatización completa.
									</p>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
											Proveedor
										</label>
										<div className="relative">
											<Bot
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
											/>
											<select
												value={captchaProvider}
												onChange={(e) =>
													setCaptchaProvider(
														e.target.value,
													)
												}
												className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 appearance-none transition-all hover:bg-white/10"
												style={{ colorScheme: "dark" }}
											>
												<option
													value="manual"
													className="bg-[#0a0a0a]"
												>
													Manual (gratis)
												</option>
												<option
													value="freecaptchabypass"
													className="bg-[#0a0a0a]"
												>
													FreeCaptchaBypass
												</option>
												<option
													value="nextcaptcha"
													className="bg-[#0a0a0a]"
												>
													NextCaptcha
												</option>
												<option
													value="capmonster"
													className="bg-[#0a0a0a]"
												>
													CapMonster
												</option>
												<option
													value="2captcha"
													className="bg-[#0a0a0a]"
												>
													2Captcha
												</option>
											</select>
										</div>
									</div>

									<div>
										<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
											API Key
										</label>
										<div className="relative">
											<Key
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
											/>
											<input
												type="password"
												value={captchaApiKey}
												onChange={(e) =>
													setCaptchaApiKey(
														e.target.value,
													)
												}
												disabled={
													captchaProvider === "manual"
												}
												placeholder={
													captchaProvider === "manual"
														? "No requerida"
														: "Tu API key..."
												}
												className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-white/10"
											/>
										</div>
									</div>
								</div>

								{captchaProvider !== "manual" &&
									!captchaApiKey && (
										<p className="text-[10px] text-amber-400/70 flex items-center gap-1 ml-1">
											<AlertCircle size={10} />
											Ingresa tu API key o se usará el
											modo manual
										</p>
									)}
							</div>
						)}
					</div>
				)}

				<div className="pt-2 sm:pt-4">
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800/50 disabled:to-indigo-800/50 disabled:border-white/5 disabled:opacity-50 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.4)] border border-white/10"
					>
						{isSubmitting ? "Procesando..." : "Validar Comprobante"}
						<ChevronRight size={18} />
					</button>
				</div>
			</form>
		</div>
	);
};

export default CEPForm;
