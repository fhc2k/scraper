import * as yup from 'yup';
import { MEXICAN_BANKS } from './constants';

const bankIds = MEXICAN_BANKS.map(b => b.id);

export const cepSchema = yup.object().shape({
  fecha: yup.string()
    .required('La fecha es obligatoria'),
  referencia: yup.string()
    .required('La referencia es obligatoria')
    .min(1, 'Referencia no válida'),
  emisor: yup.string()
    .required('El banco emisor es obligatorio')
    .oneOf(bankIds, 'Banco emisor no válido'),
  receptor: yup.string()
    .required('El banco receptor es obligatorio')
    .oneOf(bankIds, 'Banco receptor no válido'),
  cuentaBeneficiaria: yup.string()
    .required('La cuenta es obligatoria')
    .transform((value) => value ? value.replace(/\s+/g, '') : '')
    .matches(/^\d{18}$/, 'Debe ser una CLABE de 18 dígitos'),
  monto: yup.string()
    .required('El monto es obligatorio')
    .transform((value) => value ? value.replace(/,/g, '') : '')
    .test('is-number', 'El monto debe ser un número válido', (value) => !isNaN(parseFloat(value)))
    .test('is-positive', 'El monto debe ser mayor a 0', (value) => parseFloat(value) > 0),
});
