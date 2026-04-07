import mongoose from "mongoose";

const CepQuerySchema = new mongoose.Schema(
    {
        id_transaccion: {
            type: String,
            required: true,
        },
        fingerprint: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        last_sync: { type: Date, default: Date.now },
        fecha: { type: String, required: true },
        monto: { type: String, required: true },
        referencia: { type: String, required: true },
        cuentaBeneficiaria: { type: String, required: true },
        emisor: { type: String, required: true },
        receptor: { type: String, required: true },
        banco_emisor: { type: String, required: true },
        banco_receptor: { type: String, required: true },
        nombre_beneficiario: { type: String, required: true },
        rfc_ordenante: { type: String },
        rfc_beneficiario: { type: String },
        concepto_pago: { type: String },
        estado: { type: String },
        clave_rastreo: { type: String },
        fecha_operacion: { type: String },
        fecha_validacion: { type: String },
        pdfBase64: { type: String },
        rawXml: { type: String },
    },
    {
        timestamps: true,
        strict: false,
    },
);

CepQuerySchema.index({ last_sync: -1 });

delete mongoose.models.CepQuery;
const CepQuery = mongoose.model("CepQuery", CepQuerySchema);

export default CepQuery;
