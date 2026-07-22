# Costos de flota

Control de gastos, consumo de combustible y kilometraje de una flota de vehículos.

Registra gastos por categoría, calcula el importe de las cargas de combustible a
partir de los litros y el precio base más impuestos, lleva el historial del
odómetro y arma informes mensuales y comparativas entre vehículos.

## Stack

- **React 19** + **Vite 6** — sin framework de estilos, todo con estilos inline
- **Vercel Functions** (`/api`) — endpoints serverless
- **Postgres** (Neon) — persistencia

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
```

Sin `DATABASE_URL` la app funciona igual: guarda todo en `localStorage` y
muestra el cartel *"Solo este equipo"*. Es el modo con el que se puede probar
sin infraestructura.

Para levantar también las funciones de `/api`:

```bash
npx vercel dev
```

## Base de datos

```bash
export DATABASE_URL="postgresql://…"

npm run db:setup                       # crea el esquema (idempotente)
npm run db:seed                        # carga db/seed.json
npm run db:seed -- ruta/al/backup.json # carga otro export
```

El esquema está en [`db/schema.sql`](db/schema.sql):

| Tabla | Contenido |
|---|---|
| `vehicles` | Vehículos de la flota, con km iniciales |
| `expenses` | Gastos: categoría, importe, litros, km, fecha, nota |
| `odometer_readings` | Lecturas manuales del odómetro |
| `fuel_prices` | Precio base actual por tipo de combustible |
| `fuel_price_history` | Snapshot de precios en cada actualización |
| `taxes` | Impuestos aplicados sobre el precio base |

## Cómo se calcula el combustible

El precio que se carga en Precios es el **precio base por litro, sin impuestos**.
El importe de una carga sale de aplicarle todos los impuestos configurados:

```
precio final por litro = base × (1 + Σ impuestos)
importe                = litros × precio final por litro
```

Con los valores por defecto (IVA 21% + otro impuesto 15,5% = 36,5%):

| Combustible | Base | Final |
|---|---:|---:|
| GNC | $821,07 | $1.120,76 |
| Super | $1.494,97 | $2.040,63 |
| Gasoil | $1.665,25 | $2.273,07 |
| Eurodiesel | $1.781,77 | $2.432,12 |

Cambiar los precios **no reescribe los gastos ya registrados** — cada gasto
guarda el importe con el que se cargó. Cada actualización queda registrada en
el historial.

## Kilometraje

Los km de un mes se calculan como la **lectura más alta del mes menos la última
lectura anterior al mes** (o los km iniciales del vehículo si no hay ninguna
previa). Sirven tanto las lecturas cargadas en Odómetro como el campo km
opcional de cada gasto.

Si un mes no tiene ninguna lectura, la app muestra *"Sin lectura"* en vez de
inventar un valor.

## Persistencia

La UI nunca espera a la red: cada cambio se escribe en `localStorage` al
instante y se sincroniza contra Postgres con un debounce de 900 ms. El estado
del sync se ve en el cartel al lado del título:

| Cartel | Significado |
|---|---|
| Guardado | Sincronizado con la base |
| Guardando… | Push en curso |
| Solo este equipo | No hay base configurada — los datos viven en el navegador |
| Sin sincronizar | La base falló; los datos están a salvo localmente |

## Deploy

1. Importar el repo en Vercel (framework detectado: Vite).
2. Configurar `DATABASE_URL` en las variables de entorno del proyecto.
3. Correr `npm run db:setup` y `npm run db:seed` apuntando a esa base.

## Backup

**Precios → Exportar datos** baja un JSON con todo. Ese mismo archivo se
restaura desde **Precios → Importar datos** o con `npm run db:seed`.
