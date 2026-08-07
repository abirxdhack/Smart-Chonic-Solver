import { Route as rootRouteImport } from './routes/__root'
import { Route as SolverRouteImport } from './routes/solver'
import { Route as SitemapDotxmlRouteImport } from './routes/sitemap[.]xml'
import { Route as ShareRouteImport } from './routes/share'
import { Route as ParabolaSolverRouteImport } from './routes/parabola-solver'
import { Route as ParabolaFormulasRouteImport } from './routes/parabola-formulas'
import { Route as ParabolaRouteImport } from './routes/parabola'
import { Route as HyperbolaFormulasRouteImport } from './routes/hyperbola-formulas'
import { Route as HyperbolaRouteImport } from './routes/hyperbola'
import { Route as EllipseFormulasRouteImport } from './routes/ellipse-formulas'
import { Route as EllipseRouteImport } from './routes/ellipse'
import { Route as IndexRouteImport } from './routes/index'

const SolverRoute = SolverRouteImport.update({
  id: '/solver',
  path: '/solver',
  getParentRoute: () => rootRouteImport,
} as any)
const SitemapDotxmlRoute = SitemapDotxmlRouteImport.update({
  id: '/sitemap.xml',
  path: '/sitemap.xml',
  getParentRoute: () => rootRouteImport,
} as any)
const ShareRoute = ShareRouteImport.update({
  id: '/share',
  path: '/share',
  getParentRoute: () => rootRouteImport,
} as any)
const ParabolaSolverRoute = ParabolaSolverRouteImport.update({
  id: '/parabola-solver',
  path: '/parabola-solver',
  getParentRoute: () => rootRouteImport,
} as any)
const ParabolaFormulasRoute = ParabolaFormulasRouteImport.update({
  id: '/parabola-formulas',
  path: '/parabola-formulas',
  getParentRoute: () => rootRouteImport,
} as any)
const ParabolaRoute = ParabolaRouteImport.update({
  id: '/parabola',
  path: '/parabola',
  getParentRoute: () => rootRouteImport,
} as any)
const HyperbolaFormulasRoute = HyperbolaFormulasRouteImport.update({
  id: '/hyperbola-formulas',
  path: '/hyperbola-formulas',
  getParentRoute: () => rootRouteImport,
} as any)
const HyperbolaRoute = HyperbolaRouteImport.update({
  id: '/hyperbola',
  path: '/hyperbola',
  getParentRoute: () => rootRouteImport,
} as any)
const EllipseFormulasRoute = EllipseFormulasRouteImport.update({
  id: '/ellipse-formulas',
  path: '/ellipse-formulas',
  getParentRoute: () => rootRouteImport,
} as any)
const EllipseRoute = EllipseRouteImport.update({
  id: '/ellipse',
  path: '/ellipse',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/ellipse': typeof EllipseRoute
  '/ellipse-formulas': typeof EllipseFormulasRoute
  '/hyperbola': typeof HyperbolaRoute
  '/hyperbola-formulas': typeof HyperbolaFormulasRoute
  '/parabola': typeof ParabolaRoute
  '/parabola-formulas': typeof ParabolaFormulasRoute
  '/parabola-solver': typeof ParabolaSolverRoute
  '/share': typeof ShareRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/solver': typeof SolverRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/ellipse': typeof EllipseRoute
  '/ellipse-formulas': typeof EllipseFormulasRoute
  '/hyperbola': typeof HyperbolaRoute
  '/hyperbola-formulas': typeof HyperbolaFormulasRoute
  '/parabola': typeof ParabolaRoute
  '/parabola-formulas': typeof ParabolaFormulasRoute
  '/parabola-solver': typeof ParabolaSolverRoute
  '/share': typeof ShareRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/solver': typeof SolverRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/ellipse': typeof EllipseRoute
  '/ellipse-formulas': typeof EllipseFormulasRoute
  '/hyperbola': typeof HyperbolaRoute
  '/hyperbola-formulas': typeof HyperbolaFormulasRoute
  '/parabola': typeof ParabolaRoute
  '/parabola-formulas': typeof ParabolaFormulasRoute
  '/parabola-solver': typeof ParabolaSolverRoute
  '/share': typeof ShareRoute
  '/sitemap.xml': typeof SitemapDotxmlRoute
  '/solver': typeof SolverRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/ellipse'
    | '/ellipse-formulas'
    | '/hyperbola'
    | '/hyperbola-formulas'
    | '/parabola'
    | '/parabola-formulas'
    | '/parabola-solver'
    | '/share'
    | '/sitemap.xml'
    | '/solver'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/ellipse'
    | '/ellipse-formulas'
    | '/hyperbola'
    | '/hyperbola-formulas'
    | '/parabola'
    | '/parabola-formulas'
    | '/parabola-solver'
    | '/share'
    | '/sitemap.xml'
    | '/solver'
  id:
    | '__root__'
    | '/'
    | '/ellipse'
    | '/ellipse-formulas'
    | '/hyperbola'
    | '/hyperbola-formulas'
    | '/parabola'
    | '/parabola-formulas'
    | '/parabola-solver'
    | '/share'
    | '/sitemap.xml'
    | '/solver'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  EllipseRoute: typeof EllipseRoute
  EllipseFormulasRoute: typeof EllipseFormulasRoute
  HyperbolaRoute: typeof HyperbolaRoute
  HyperbolaFormulasRoute: typeof HyperbolaFormulasRoute
  ParabolaRoute: typeof ParabolaRoute
  ParabolaFormulasRoute: typeof ParabolaFormulasRoute
  ParabolaSolverRoute: typeof ParabolaSolverRoute
  ShareRoute: typeof ShareRoute
  SitemapDotxmlRoute: typeof SitemapDotxmlRoute
  SolverRoute: typeof SolverRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/solver': {
      id: '/solver'
      path: '/solver'
      fullPath: '/solver'
      preLoaderRoute: typeof SolverRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/sitemap.xml': {
      id: '/sitemap.xml'
      path: '/sitemap.xml'
      fullPath: '/sitemap.xml'
      preLoaderRoute: typeof SitemapDotxmlRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/share': {
      id: '/share'
      path: '/share'
      fullPath: '/share'
      preLoaderRoute: typeof ShareRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/parabola-solver': {
      id: '/parabola-solver'
      path: '/parabola-solver'
      fullPath: '/parabola-solver'
      preLoaderRoute: typeof ParabolaSolverRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/parabola-formulas': {
      id: '/parabola-formulas'
      path: '/parabola-formulas'
      fullPath: '/parabola-formulas'
      preLoaderRoute: typeof ParabolaFormulasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/parabola': {
      id: '/parabola'
      path: '/parabola'
      fullPath: '/parabola'
      preLoaderRoute: typeof ParabolaRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/hyperbola-formulas': {
      id: '/hyperbola-formulas'
      path: '/hyperbola-formulas'
      fullPath: '/hyperbola-formulas'
      preLoaderRoute: typeof HyperbolaFormulasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/hyperbola': {
      id: '/hyperbola'
      path: '/hyperbola'
      fullPath: '/hyperbola'
      preLoaderRoute: typeof HyperbolaRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/ellipse-formulas': {
      id: '/ellipse-formulas'
      path: '/ellipse-formulas'
      fullPath: '/ellipse-formulas'
      preLoaderRoute: typeof EllipseFormulasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/ellipse': {
      id: '/ellipse'
      path: '/ellipse'
      fullPath: '/ellipse'
      preLoaderRoute: typeof EllipseRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  EllipseRoute: EllipseRoute,
  EllipseFormulasRoute: EllipseFormulasRoute,
  HyperbolaRoute: HyperbolaRoute,
  HyperbolaFormulasRoute: HyperbolaFormulasRoute,
  ParabolaRoute: ParabolaRoute,
  ParabolaFormulasRoute: ParabolaFormulasRoute,
  ParabolaSolverRoute: ParabolaSolverRoute,
  ShareRoute: ShareRoute,
  SitemapDotxmlRoute: SitemapDotxmlRoute,
  SolverRoute: SolverRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
