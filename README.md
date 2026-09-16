# 🍽️ Restaurante Castillo — Sistema de Gestión

Sistema integral de gestión para restaurantes, construido para reemplazar el flujo 100% en papel de un restaurante real (toma de pedidos, cocina y caja) por una operación digital en tiempo real, con roles diferenciados para meseros, cocina y administración.

## ✨ Funcionalidades

- **POS para meseros** — selección de mesa, catálogo de productos con búsqueda, carrito con notas por plato, descuentos configurables, división de cuenta y cobro (efectivo/tarjeta).
- **Kitchen Display System (KDS)** — pantalla de cocina en tiempo real (Supabase Realtime), pedidos ordenados FIFO, temporizador por plato, alerta sonora al marcar un plato listo.
- **Panel administrativo** — resumen de ventas del día, gestión de mesas, productos, inventario (bebidas/postres) con alertas de stock bajo, reservas y usuarios.
- **Control de acceso por roles** — Superadmin, Admin/Gerente, Mesero y Cocina, con seguridad a nivel de fila (Row Level Security) en la base de datos, no solo en la interfaz.
- **Comprobantes térmicos** — generación e impresión automática de boletas ajustadas a papel térmico (58mm/80mm) al cerrar un pedido.
- **Backup descargable** — exportación mensual en `.zip` de todas las boletas/facturas emitidas, con resumen en CSV.
- **Responsive** — pensado para tablet/celular en el piso del restaurante y desktop en administración.

## 🛠️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL (Supabase), con RLS por rol |
| Autenticación | Supabase Auth |
| Tiempo real | Supabase Realtime (WebSocket) |
| Estado / datos | TanStack Query (React Query) |
| Recibos / QR | qrcode |
| Backup | JSZip (generado 100% en el cliente) |

## 📐 Arquitectura

- **RLS-first**: los permisos por rol (quién puede crear pedidos, gestionar reservas, crear usuarios, etc.) están definidos como políticas de PostgreSQL, no solo ocultando botones en el frontend — ver [`sql/001_schema_inicial.sql`](sql/001_schema_inicial.sql).
- **Creación de usuarios con doble flujo de verificación**: Admin/Gerente requiere verificación de correo (Supabase Auth), mientras que Mesero/Cocina se crean con acceso simple gestionado por el superadmin — reflejando cómo opera realmente el negocio.
- **Sin backend adicional**: toda la lógica vive en Next.js API Routes / Route Handlers y en políticas de base de datos; el backup en zip se genera en el navegador sin necesidad de un servicio extra.

## 🚀 Cómo correrlo localmente

```bash
npm install
cp .env.local.example .env.local   # completar con tus credenciales de Supabase
npm run dev
```

Ejecuta el esquema en [`sql/001_schema_inicial.sql`](sql/001_schema_inicial.sql) en el SQL Editor de tu proyecto de Supabase antes de arrancar.

## 📋 Contexto del proyecto

Desarrollado a partir de un levantamiento de requerimientos real con el dueño de un restaurante de comida criolla (ver [`requerimientos_finales.md`](requerimientos_finales.md)), priorizando reducir errores de pedidos, dar visibilidad de ventas/ganancia en tiempo real, y digitalizar el flujo de cocina sin perder la simplicidad de uso para personal sin experiencia técnica.
