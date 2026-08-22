# Guía de estilo — Gym Multiempresa

UI calmada y funcional (criterio `uncodixfy`): nada de azul/cian "AI", sin
gradientes, sin sombras dramáticas, sin tarjetas KPI multicolor. El chrome de
la plataforma es **neutro**; el único color de marca lo inyecta el tenant
(`Empresa.colorPrimario`), coherente con el modelo multi-tenant.

## Principios
- Chrome neutro tipo GitHub/Linear (grises + un acento).
- El acento (`--brand`) viene del `colorPrimario` del tenant; por defecto verde
  atlético `#2b8a3e` (claro) / `#40c463` (oscuro). Nunca azul ni cian.
- Tipografía del sistema, sin Inter/Roboto.
- Radios modestos (4–8px), bordes sutiles de 1px, hover por color no transform.
- Estados (success/error/warning/info) solo con color + icono FontAwesome.

## Tokens (CSS vars en `src/index.css`)
| Token | Light | Dark |
|-------|-------|------|
| `--brand` | `#2b8a3e` | `#40c463` |
| `--c-bg` | `#f6f8fa` | `#0d1117` |
| `--c-surface` | `#ffffff` | `#161b22` |
| `--c-border` | `#d0d7de` | `#30363d` |
| `--c-text` | `#1f2328` | `#e6edf3` |
| `--text-muted` | `#656d76` | `#8b949e` |

Tailwind expone: `bg-bg`, `bg-surface`, `border-border`, `text-content`,
`text-muted`, `bg-brand`, `text-brand`, `border-error`, `border-success`.

## Reglas de componentes
- Botones primarios: `bg-brand text-white rounded hover:bg-brand-strong`.
- Inputs/selects: `border border-border bg-surface text-content placeholder:text-muted`.
- Tablas: `bg-surface border border-border`, cabecera `bg-bg`, filas
  `border-t border-border hover:bg-bg`, texto alineado a la izquierda.
- Dashboard: panel de fila etiqueta/valor, sin tarjetas de color.
- Iconos: `<i className="fa-solid fa-...">`, nunca emojis.

## Dark mode
Toggle en el Layout aplica `data-theme="dark"` + clase `dark` en `<html>`,
persistido en `localStorage`. El theme de PrimeReact (`lara-light-green` /
`lara-dark-green`) se swapea vía `<link id="prime-theme">` en
`src/theme/primeTheme.ts`.

## Componentes (PrimeReact)
Las tablas usan `DataTable` + `Column` de `primereact`, con `paginator` y
`rowsPerPageOptions`. Botones con `Button` de `primereact/button`, estados con
`Tag` de `primereact/tag`. Fuente de PrimeReact forzada a la del sistema
(`.p-component`) para no cargar Inter.
