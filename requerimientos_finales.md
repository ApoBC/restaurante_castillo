# 📋 Documento de Requerimientos Final - Sistema de Gestión "Restaurante Castillo"

**Fecha:** Septiembre 2026
**Cliente:** Restaurante Castillo
**Estado:** Definitivo v1.0 (consolidado a partir de levantamiento + decisiones del cliente)

---

## 1. CONTEXTO DEL NEGOCIO

| Dato | Valor |
|---|---|
| Nombre | Restaurante Castillo |
| Tipo de comida | Almuerzos con menú variado (7-10 opciones/día), menú ejecutivo, cena, menús ligeros, bebidas calientes |
| Años en operación | 3 |
| Sucursales | 1 (sin planes inmediatos de expansión, pero se busca dejar la arquitectura preparada) |
| Empleados | 6 |
| Horario | Almuerzo y cena |
| Mesas | 20 (numeración simple, sin distinción de pisos) |
| Toma de pedidos actual | Papel / oral |
| Registro de ventas actual | Ninguno — solo se recibe el dinero |
| Delivery | Sí, pero coordinado directamente por teléfono propio (sin plataformas de terceros) |
| Pagos actuales | Efectivo (no tienen POS de tarjeta) |
| Pedidos en hora pico | ~35/hora |
| Modelo de cobro del software | Suscripción mensual |

### Problemas actuales a resolver
- Descontrol de caja: no saben cuánto venden vs. gastan.
- Ventas no registradas de bebidas/postres (no se sabe si hay ganancia).
- ~3 horas diarias en trámites administrativos.
- Errores de pedido por confusión de mesa al cobrar.
- Cocina no sabe qué pedido llegó primero ni para qué mesa.
- Sin reportes ni visibilidad de números del negocio.

---

## 2. REQUERIMIENTOS FUNCIONALES

### RF-001: Gestión de Pedidos (POS)
- Registro de pedidos por mesa (20 mesas, numeración editable por el admin).
- Interfaz táctil para mesero (tablet/smartphone), menú digital con búsqueda.
- Combos/menús del día (13-15 sets), con precios que cambian frecuentemente (menú y cena del día).
- Notas especiales por plato (alergias, sin picante, etc.).
- Descuentos manuales por el mesero (con tope % configurable por el admin).
- División de cuenta en N formas, manteniendo el detalle de cada pedido.
- Sin registro de propina.
- Impresión de boleta/recibo — **requiere soporte de impresora térmica**, ajustando el formato al ancho del papel térmico (58mm/80mm configurable).
- Pago: efectivo desde el día 1; **tarjeta como fase futura**, evaluando entre pasarela de pago digital (ej. integración vía Stripe/Culqi/Niubiz — a definir según el país) o un **POS físico de un banco/proveedor local** que opere en paralelo (el sistema solo registraría el monto y método, sin procesar la transacción directamente). Se define en fase de diseño técnico una vez el cliente tenga el proveedor.
- Sincronización en tiempo real con cocina.

### RF-002: Kitchen Display System (KDS)
- Un solo monitor que centraliza las 3 estaciones (preparación, freidora, grill).
- Pedidos ordenados por antigüedad (FIFO).
- Código de color por estado (nuevo / en preparación / listo).
- Temporizador visible por plato, para medir y mejorar tiempos.
- Botón "listo" que dispara una **alerta sonora (timbre)** al mesero — no se imprime en cocina, todo en pantalla.

### RF-003: Inventario (simplificado)
- Alcance: **solo bebidas y postres del día** (no ingredientes de cocina).
- Registro de stock actual y reposición semanal.
- Alertas automáticas cuando el stock baja de un mínimo configurado.
- Ajuste manual del conteo cuando el dueño hace recuento físico (sin frecuencia fija).
- Sin manejo de fechas de vencimiento ni reportes de consumo por receta.

### RF-004: Reportes y Analytics
- Reporte diario y mensual: ventas totales, costo, ganancia neta.
- Top platos más vendidos / productos que no se venden.
- Ocupación promedio de mesas.
- Exportación a Excel.
- Sin envío automático por email.
- **Backup de comprobantes**: exportación mensual descargable en un **archivo .zip** conteniendo únicamente boletas y facturas del período (no incluye tickets internos de cocina).

### RF-005: Facturación Electrónica
- Prioridad alta, pero **condicionada a definir la integración con la API de SUNAT** en fase de diseño técnico (Perú, dado el prefijo telefónico +51 del contacto).
- Mientras se resuelve esa integración, el sistema debe emitir boletas/comprobantes internos con numeración secuencial, desglose de IVA/IGV y QR, listos para conectarse a SUNAT cuando se defina el proveedor (Facturador propio vs. servicio de terceros tipo Nubefact/Efact).
- Conservación de comprobantes mínimo 5 años.

### RF-006: Reservas
- Se mantiene en el **MVP** (no como fase futura), a solicitud del cliente.
- Registro: nombre, teléfono, fecha, hora, N° de comensales (máx. 12).
- Solo se reciben por teléfono y se cargan manualmente al sistema.
- **Solo el administrador/gerente puede crear y gestionar reservas** (no el mesero, según la decisión más reciente del cliente — ver nota en sección 4).
- Confirmación el día anterior y recordatorio automático (solo la hora, no el detalle de platos).
- No se aceptan reservas parciales de mesa.

### RF-007: Gestión de Usuarios y Empleados
- **Roles:** Superadmin, Admin/Gerente, Mesero, Cocina.
- **Superadmin**: único rol que puede crear/editar/eliminar usuarios y asignar roles.
- **Autenticación diferenciada (vía Supabase Auth):**
  - Admin/Gerente: cuenta con **correo verificado** (flujo de verificación de email de Supabase Auth).
  - Mesero/Cocina: acceso simple (PIN o usuario/contraseña) gestionado y creado por el admin/gerente, sin requerir verificación de correo propio.
- Registro de qué mesero generó cada venta (para trazabilidad, no para nómina).
- Sin gestión de turnos, asistencia ni nómina.

### RF-008: Delivery (propio, sin terceros)
- Registro de pedidos delivery bajo el mismo flujo del POS, marcando el pedido como "delivery" en vez de mesa.
- Sin integración con Uber Eats/Talabat u otras plataformas (no aplica).

---

## 3. REQUERIMIENTOS NO FUNCIONALES

### RNF-001: Seguridad
- Contraseñas/PIN encriptados (gestionado por Supabase Auth).
- Control de acceso por rol: Superadmin, Admin/Gerente, Mesero, Cocina.
- Registro de auditoría (quién hizo qué acción y cuándo), para prevenir borrados accidentales.
- Protección contra SQL injection/XSS (mitigado por uso de Supabase + ORM/queries parametrizadas).
- HTTPS obligatorio, sesiones con timeout.

### RNF-002: Confiabilidad
- Funcionamiento offline para toma de pedidos si se cae internet, con sincronización automática al reconectar.
- Backup automático de la base de datos (frecuencia técnica estándar), adicional al backup mensual descargable de boletas/facturas en zip (RF-004).

### RNF-003: Performance
- Registro de pedido en <2 segundos.
- Soporte cómodo para ~35 pedidos/hora en pico (10 usuarios simultáneos es más que suficiente de margen).

### RNF-004: Escalabilidad
- Arquitectura preparada para multi-sucursal a futuro, aunque el lanzamiento es de 1 solo local.

### RNF-005: Usabilidad
- Interfaz en español, responsive (tablet/smartphone/desktop), aprendizaje en <30 min para el personal.

---

## 4. PUNTOS QUE QUEDAN ABIERTOS PARA LA SIGUIENTE FASE (diseño técnico)

Estos no bloquean el arranque del proyecto pero se deben definir antes de construir el módulo correspondiente:

1. **Pagos con tarjeta**: definir si se integra pasarela digital o si se trabaja con POS físico de un banco en paralelo (afecta si el sistema solo registra el monto o si procesa la transacción).
2. **Facturación electrónica**: confirmar si el país de operación es Perú y definir proveedor de integración con SUNAT (directo vs. facturador electrónico de terceros).
3. **Reservas — quién las gestiona**: la propuesta original mencionaba que también el mesero podría reservar; tu última respuesta indica que se mantiene solo en el admin. Confirmar esto antes de diseñar permisos, ya que es una diferencia de alcance real.
4. **Modelo de impresora térmica**: confirmar marca/modelo o al menos el ancho de papel (58mm vs 80mm) para ajustar el formato de impresión.
5. **Presupuesto y tiempos**: el monto de la propuesta original ($12,500 + mantenimiento mensual) es solo referencial de la plantilla; se debe generar una estimación real una vez cerrado este documento.

---

## 5. STACK TÉCNICO (referencia — ver `stack_tecnologico_completo.md`)

- **Frontend/Backend:** Next.js 14 + TypeScript + Tailwind CSS
- **Base de datos:** PostgreSQL (Supabase)
- **Tiempo real:** Supabase Realtime (WebSocket) — para KDS y sincronización de pedidos
- **Auth:** Supabase Auth (con verificación de email solo para Admin/Gerente)
- **Deploy:** Vercel (frontend + backend) + Supabase (BD + auth)
- **Pendiente de agregar al stack:** librería de impresión térmica (ej. `react-thermal-printer` o integración ESC/POS vía navegador/plugin), y el conector de facturación electrónica una vez definido el proveedor.

---

## 6. FASES DE IMPLEMENTACIÓN (ajustadas)

### Fase 1 — MVP
- POS de pedidos por mesa + delivery propio
- KDS (1 monitor, FIFO, timbre de aviso)
- Reportes básicos (ventas, ganancia, top platos)
- Roles y login (Superadmin, Admin, Mesero, Cocina) con Supabase Auth
- Reservas (gestionadas por admin)
- Impresión de boleta en impresora térmica

### Fase 2 — Mejoras
- Inventario de bebidas y postres con alertas de stock
- Facturación electrónica (según definición de proveedor SUNAT)
- Backup mensual descargable en zip
- Pagos con tarjeta (pasarela o integración con POS físico)

### Fase 3 — Futuro
- Multi-sucursal
- App de clientes / análisis predictivo
