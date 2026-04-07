import { Poppins, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "CEP-BANXICO-QUERY v1.0",
    description:
        "Plataforma de automatización y consulta de Comprobantes Electrónicos de Pago (CEP) del Banco de México.",
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col" suppressHydrationWarning>
                <SmoothScroll>
                    {children}
                </SmoothScroll>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: "rgba(15, 15, 15, 0.95)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#fff",
                            backdropFilter: "blur(12px)",
                            borderRadius: "14px",
                            fontSize: "13px",
                            padding: "14px 18px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        },
                    }}
                    richColors
                    closeButton
                    theme="dark"
                />
            </body>
        </html>
    );
}
