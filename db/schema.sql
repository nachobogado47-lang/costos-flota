-- Esquema de costos de flota. Postgres (Neon / Supabase).
-- Idempotente: se puede correr varias veces sin romper nada.

CREATE TABLE IF NOT EXISTS vehicles (
  id          TEXT PRIMARY KEY,
  name        TEXT        NOT NULL,
  plate       TEXT        NOT NULL,
  brand       TEXT        NOT NULL DEFAULT '',
  model       TEXT        NOT NULL DEFAULT '',
  year        TEXT        NOT NULL DEFAULT '',
  initial_km  INTEGER     NOT NULL DEFAULT 0,
  color_idx   SMALLINT    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  vehicle_id  TEXT        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  fuel_type   TEXT,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  liters      NUMERIC(12,3) NOT NULL DEFAULT 0,
  km          INTEGER     NOT NULL DEFAULT 0,
  date        DATE        NOT NULL,
  note        TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_vehicle_idx ON expenses (vehicle_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx    ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS expenses_type_idx    ON expenses (type);

CREATE TABLE IF NOT EXISTS odometer_readings (
  id          TEXT PRIMARY KEY,
  vehicle_id  TEXT        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  km          INTEGER     NOT NULL,
  date        DATE        NOT NULL,
  note        TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS odometer_vehicle_idx ON odometer_readings (vehicle_id);
CREATE INDEX IF NOT EXISTS odometer_date_idx    ON odometer_readings (date DESC);

-- Precio base por litro, sin impuestos. Una fila por tipo de combustible.
CREATE TABLE IF NOT EXISTS fuel_prices (
  fuel_type   TEXT PRIMARY KEY,
  base_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Snapshot de todos los precios cada vez que se actualizan.
CREATE TABLE IF NOT EXISTS fuel_price_history (
  id          TEXT PRIMARY KEY,
  date        DATE        NOT NULL,
  prices      JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fuel_history_date_idx ON fuel_price_history (date DESC);

-- Impuestos aplicados sobre el precio base del combustible.
CREATE TABLE IF NOT EXISTS taxes (
  id          TEXT PRIMARY KEY,
  label       TEXT          NOT NULL,
  pct         NUMERIC(6,3)  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
