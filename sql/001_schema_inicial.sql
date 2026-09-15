-- =========================================================
-- Restaurante Castillo - Esquema inicial de base de datos
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)
-- =========================================================

-- ---------- TIPOS ENUM ----------
create type rol_usuario as enum ('superadmin', 'admin', 'mesero', 'cocina');
create type estado_mesa as enum ('libre', 'ocupada', 'reservada');
create type tipo_producto as enum ('plato', 'bebida', 'postre', 'menu_dia', 'combo');
create type tipo_pedido as enum ('mesa', 'delivery');
create type estado_pedido as enum ('nuevo', 'en_preparacion', 'listo', 'pagado', 'cancelado');
create type estado_item as enum ('nuevo', 'en_preparacion', 'listo');
create type metodo_pago as enum ('efectivo', 'tarjeta');
create type estado_reserva as enum ('pendiente', 'confirmada', 'cancelada', 'completada');
create type tipo_comprobante as enum ('boleta', 'factura');
create type tipo_movimiento_inventario as enum ('entrada', 'salida', 'ajuste');

-- ---------- USUARIOS (perfil vinculado a auth.users) ----------
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null,
  activo boolean not null default true,
  creado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

-- ---------- MESAS ----------
create table mesas (
  id serial primary key,
  numero int not null unique,
  capacidad int not null default 4,
  estado estado_mesa not null default 'libre',
  updated_at timestamptz not null default now()
);

-- ---------- PRODUCTOS ----------
create table productos (
  id serial primary key,
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  tipo tipo_producto not null,
  disponible boolean not null default true,
  controla_inventario boolean not null default false, -- true solo para bebidas/postres
  created_at timestamptz not null default now()
);

-- ---------- PEDIDOS ----------
create table pedidos (
  id bigserial primary key,
  tipo tipo_pedido not null default 'mesa',
  mesa_id int references mesas(id),
  estado estado_pedido not null default 'nuevo',
  mesero_id uuid not null references usuarios(id),
  subtotal numeric(10,2) not null default 0,
  descuento_pct numeric(5,2) not null default 0,
  total numeric(10,2) not null default 0,
  metodo_pago metodo_pago,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ITEMS DE PEDIDO ----------
create table pedido_items (
  id bigserial primary key,
  pedido_id bigint not null references pedidos(id) on delete cascade,
  producto_id int not null references productos(id),
  cantidad int not null default 1,
  precio_unitario numeric(10,2) not null,
  nota text,
  estado estado_item not null default 'nuevo',
  iniciado_en timestamptz, -- para el temporizador del KDS
  listo_en timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- INVENTARIO (solo bebidas y postres) ----------
create table inventario (
  id serial primary key,
  producto_id int not null unique references productos(id),
  stock_actual numeric(10,2) not null default 0,
  stock_minimo numeric(10,2) not null default 0,
  unidad text not null default 'unidad',
  updated_at timestamptz not null default now()
);

create table movimientos_inventario (
  id bigserial primary key,
  producto_id int not null references productos(id),
  tipo tipo_movimiento_inventario not null,
  cantidad numeric(10,2) not null,
  motivo text,
  usuario_id uuid not null references usuarios(id),
  created_at timestamptz not null default now()
);

-- ---------- RESERVAS (gestionadas solo por admin/superadmin) ----------
create table reservas (
  id bigserial primary key,
  nombre_cliente text not null,
  telefono text not null,
  fecha date not null,
  hora time not null,
  num_comensales int not null check (num_comensales <= 12),
  mesa_id int references mesas(id),
  estado estado_reserva not null default 'pendiente',
  creado_por uuid not null references usuarios(id),
  created_at timestamptz not null default now()
);

-- ---------- COMPROBANTES (boletas/facturas) ----------
create table comprobantes (
  id bigserial primary key,
  pedido_id bigint not null references pedidos(id),
  tipo tipo_comprobante not null default 'boleta',
  serie text,
  correlativo int,
  subtotal numeric(10,2) not null,
  igv numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  pdf_url text,
  enviado_sunat boolean not null default false, -- se activa cuando se defina el proveedor SUNAT
  created_at timestamptz not null default now()
);

-- ---------- AUDITORÍA ----------
create table auditoria (
  id bigserial primary key,
  usuario_id uuid references usuarios(id),
  accion text not null,
  entidad text not null,
  entidad_id text,
  detalle jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table usuarios enable row level security;
alter table mesas enable row level security;
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table inventario enable row level security;
alter table movimientos_inventario enable row level security;
alter table reservas enable row level security;
alter table comprobantes enable row level security;
alter table auditoria enable row level security;

-- Helper: obtiene el rol del usuario autenticado actual
create or replace function rol_actual()
returns rol_usuario
language sql
security definer
stable
as $$
  select rol from usuarios where id = auth.uid();
$$;

-- Todo usuario autenticado y activo puede leer catálogos base
create policy "lectura_mesas" on mesas for select using (auth.uid() is not null);
create policy "lectura_productos" on productos for select using (auth.uid() is not null);

-- Solo admin/superadmin gestionan mesas y productos
create policy "escritura_mesas_admin" on mesas for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

create policy "escritura_productos_admin" on productos for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

-- Pedidos: mesero crea/lee, cocina lee/actualiza estado, admin todo
create policy "lectura_pedidos" on pedidos for select using (auth.uid() is not null);
create policy "creacion_pedidos_mesero" on pedidos for insert
  with check (rol_actual() in ('mesero', 'admin', 'superadmin'));
create policy "actualizacion_pedidos" on pedidos for update
  using (rol_actual() in ('mesero', 'cocina', 'admin', 'superadmin'));

create policy "lectura_pedido_items" on pedido_items for select using (auth.uid() is not null);
create policy "escritura_pedido_items" on pedido_items for all
  using (rol_actual() in ('mesero', 'cocina', 'admin', 'superadmin'))
  with check (rol_actual() in ('mesero', 'cocina', 'admin', 'superadmin'));

-- Inventario y reservas: solo admin/superadmin
create policy "gestion_inventario" on inventario for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

create policy "gestion_movimientos_inventario" on movimientos_inventario for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

create policy "gestion_reservas" on reservas for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

-- Comprobantes: lectura amplia, escritura admin/superadmin
create policy "lectura_comprobantes" on comprobantes for select using (auth.uid() is not null);
create policy "escritura_comprobantes" on comprobantes for all
  using (rol_actual() in ('admin', 'superadmin'))
  with check (rol_actual() in ('admin', 'superadmin'));

-- Usuarios: solo superadmin gestiona (crea/edita/desactiva) usuarios
create policy "lectura_propio_usuario" on usuarios for select
  using (auth.uid() = id or rol_actual() in ('admin', 'superadmin'));
create policy "gestion_usuarios_superadmin" on usuarios for all
  using (rol_actual() = 'superadmin')
  with check (rol_actual() = 'superadmin');

-- Auditoría: solo lectura para admin/superadmin, escritura por cualquier usuario autenticado (logging)
create policy "lectura_auditoria_admin" on auditoria for select
  using (rol_actual() in ('admin', 'superadmin'));
create policy "escritura_auditoria" on auditoria for insert
  with check (auth.uid() is not null);

-- =========================================================
-- SEED MÍNIMO (mesas 1-20)
-- =========================================================
insert into mesas (numero, capacidad)
select generate_series(1, 20), 4;
