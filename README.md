# 🏦 Banxico CEP API & Scraper - Enterprise Edition

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![BullMQ](https://img.shields.io/badge/BullMQ-Queues-blue)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Stealth-green)

Una plataforma de grado empresarial para validar, cachear y descargar Comprobantes Electrónicos de Pago (CEP) del Banco de México (Banxico), diseñada para escalar mediante flujos asíncronos distribuidos.

---

## 🌟 Arquitectura SaaS (Nivel Enterprise)

Este proyecto no es un simple scraper web; es una arquitectura backend completa diseñada para entornos distribuidos (Vercel, Railway, AWS):

### 1. Caché Multinivel (L1 / L2) ⚡
Para optimizar los tiempos de la API de Banxico (que normalmente tardan entre 60 y 90 segundos), diseñamos una estructura jerárquica de caché mediante un sistema de huellas digitales exclusivas (Fingerprinting):
*   **Layer 1 (Redis):** Almacenamientos ultra-rápidos Clave-Valor (KV). Las búsquedas cacheadas en los últimos minutos se sirven directamente desde la memoria RAM en ~1 milisegundo.
*   **Layer 2 (MongoDB):** Almacenaje persistente. Si Redis falla o expira tras 6 horas, la transacción se rescata desde MongoDB para evitar golpear la infraestructura de Banxico.

### 2. Procesamiento Asíncrono (Webhooks + BullMQ) 🐂
Implementación de un sistema **Opt-In** para B2B. Si envías la variable `webhook_url` en la petición:
*   La API responderá instantáneamente un `HTTP 202 Accepted`.
*   El trabajo se delegará a **BullMQ** (Colas de Redis), que despachará la solicitud en segundo plano.
*   Si Banxico falla, el **Worker implementa Backoff Exponencial**, reintentando la tarea un máximo de 3 veces (esperando 10s, 20s y 40s) para sobrevivir a caídas y entregar el Payload al cliente final sin perder el trabajo si ocurre un Server Crash.

### 3. Seguridad y UX Avanzada 👮
*   **API Keys:** El endpoint principal está protegido por variables de entorno requiriendo `x-api-key` headers para prevenir uso no autorizado B2B.
*   **Rate Limiter:** Limitador de memoria de IPs (max 10 peticiones por minuto por IP) con degradación elegante.
*   **Shareable Links (Deep Linking):** Sistema reactivo que inyecta parámetros en la URL (`?cep=...`), permitiendo compartir resultados específicos de forma directa.
*   **Scroll Mantequilla (Lenis):** Implementación de Scroll Inercial de alto rendimiento para una experiencia de navegación "butter-smooth" de nivel premium.
*   **Privacidad:** Historial almacenado en `localStorage`, garantizando privacidad total del usuario.

---

## 🛠️ Tecnologías Principales
*   **Frontend:** Next.js (Turbopack), React, Tailwind CSS, Framer Motion, Lenis (Smooth Scroll).
*   **Backend:** Node.js, Mongoose (MongoDB), Redis.
*   **Infraestructura:** BullMQ (Background Workers), Webhooks.
*   **Tipografía:** Poppins Modern Geometric.

---

## ⚙️ Instalación y Uso

### 1. Requisitos Previos
*   [Node.js](https://nodejs.org/es/) (v18+)
*   Base de datos MongoDB (Local o Atlas/Railway)
*   *(Opcional pero recomendado)* Redis Instancia (Ej. Upstash o Railway)

### 2. Configurar Variables de Entorno (`.env`)
Clona el repositorio e instala las dependencias:
```bash
git clone https://github.com/tu-usuario/cep-scraper.git
cd cep-scraper
npm install
```
Crea un archivo `.env` en la raíz basado en este ejemplo:
```env
DATABASE_URL="mongodb+srv://..."
# Opcionales para habilitar el Modo Enterprise
REDIS_URL="redis://..."
API_KEY="tu_llave_secreta_comercial"
ENABLE_GAMIFICATION="true"
ENABLE_SCRAPER="true"
```

### 3. Ejecutar Proyecto
```bash
npm run dev
```

---

## 🌐 Pruebas de API (Modo Webhook)

Puedes interactuar con nuestro sistema como un servicio B2B:

```bash
curl -X GET "http://localhost:3000/api/cep?monto=50000&cuentaBeneficiaria=123...&receptor=40012&emisor=90653&referencia=123123&fecha=12-08-2024&webhook_url=https://webhook.site/tu_URL_personalizada" \
-H "x-api-key: tu_llave_secreta_comercial"
```
**Respuesta:**
```json
{
  "status": "processing",
  "message": "La consulta tomará entre 70 y 90 segundos. Los resultados se enviarán al webhook proporcionado."
}
```

---

> Desplegado con orgullo como caso de estudio de arquitectura backend distribuida y prevención de cuellos de botella en infraestructuras legacy.
