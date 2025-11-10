# Smart Packaging - Front-Smartpack

Sistema de gestión de packaging inteligente migrado a Next.js 16.

## Migración desde kreatech-pack-sync

Este proyecto es la versión migrada del proyecto `kreatech-pack-sync` de Vite + React a Next.js.

### Cambios principales

1. **Router**: React Router → Next.js App Router
2. **Estructura**: 
   - `/src` contiene toda la lógica de dominio, infraestructura y presentación
   - `/app` contiene las rutas y páginas de Next.js
   - Uso de route groups `(dashboard)` para layout compartido

3. **Componentes**: Todos los componentes de UI de shadcn/ui se mantienen en `/src/components/ui`

4. **Client Components**: Los componentes interactivos están marcados con `"use client"`

## Estructura del proyecto

```
front-smartpack/
├── app/
│   ├── (dashboard)/          # Rutas protegidas con layout de dashboard
│   │   ├── layout.tsx        # Layout con sidebar
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── areas/
│   │   ├── warehouses/
│   │   ├── boxes/
│   │   ├── products/
│   │   ├── providers/
│   │   └── projects/
│   ├── login/                # Página de login
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Redirect a /login
│   ├── providers.tsx         # Providers globales
│   └── globals.css           # Estilos globales
├── src/
│   ├── components/           # Componentes de shadcn/ui
│   ├── domain/               # Entidades y repositorios
│   ├── infrastructure/       # Implementaciones mock
│   ├── presentation/         # Componentes y vistas
│   ├── hooks/                # Hooks custom
│   ├── lib/                  # Utilidades
│   └── shared/               # Constantes y tipos
└── public/                   # Archivos estáticos
```

## Instalación

```bash
npm install --legacy-peer-deps
```

> Nota: Se usa `--legacy-peer-deps` debido a conflictos de versiones entre React 19 y algunas dependencias.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Diferencias clave vs React Router

### Navegación

**Antes (React Router):**
```tsx
import { useNavigate, NavLink } from "react-router-dom";

const navigate = useNavigate();
navigate("/dashboard");

<NavLink to="/dashboard">Dashboard</NavLink>
```

**Ahora (Next.js):**
```tsx
import { useRouter } from "next/navigation";
import Link from "next/link";

const router = useRouter();
router.push("/dashboard");

<Link href="/dashboard">Dashboard</Link>
```

### Obtener la ruta actual

**Antes:**
```tsx
import { useLocation } from "react-router-dom";
const location = useLocation();
const path = location.pathname;
```

**Ahora:**
```tsx
import { usePathname } from "next/navigation";
const pathname = usePathname();
```

## Providers

Los providers globales están en `app/providers.tsx`:
- QueryClientProvider (React Query)
- TooltipProvider (shadcn/ui)
- RepositoryProvider (Context API para repositorios mock)
- Toasters (Sonner y shadcn/ui)

## Rutas

- `/` → Redirect a `/login`
- `/login` → Página de login
- `/dashboard` → Dashboard principal
- `/users` → Gestión de usuarios
- `/areas` → Gestión de áreas
- `/warehouses` → Gestión de bodegas
- `/boxes` → Gestión de cajas
- `/products` → Gestión de productos
- `/providers` → Gestión de proveedores
- `/projects` → Gestión de proyectos

## Tecnologías

- **Framework**: Next.js 16
- **React**: 19.2.0
- **UI**: shadcn/ui + Radix UI
- **Estilos**: Tailwind CSS
- **State**: React Query + Context API
- **Iconos**: Lucide React
- **Formularios**: React Hook Form + Zod
- **Gráficos**: Recharts

## Próximos pasos

1. Conectar con una API real (reemplazar mock repositories)
2. Implementar autenticación real (NextAuth, Auth0, etc.)
3. Agregar middleware para protección de rutas
4. Implementar SSR/SSG donde sea apropiado
5. Optimizar imágenes con next/image
6. Agregar tests
