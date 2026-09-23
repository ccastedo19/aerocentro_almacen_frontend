import { createBrowserRouter } from "react-router-dom";

import { RequireAdmin, RequireAuth, RequireGuest } from "@/components/auth-guards";
import { MainLayout } from "@/components/MainLayout";

import { Login } from "@/pages/Login";
import { Inicio } from "@/pages/Inicio";
import { Usuarios } from "@/pages/Usuarios";
import { Backup } from "@/pages/Backup";
import { PuntoPrestamos } from "@/pages/PuntoPrestamos";
import { Herramientas } from "@/pages/Herramientas";
import { Combinadas } from "@/pages/Combinadas";
import { Categorias } from "@/pages/Categorias";
import { Ubicaciones } from "@/pages/Ubicaciones";
import { Marcas } from "@/pages/Marcas";
import { HistorialPrestamos } from "@/pages/HistorialPrestamos";
import { HistorialRecepcion } from "@/pages/HistorialRecepcion";
import { Mecanicos } from "@/pages/Mecanicos";
import { Clientes } from "@/pages/Clientes";
import { PuntoRecepcion } from "@/pages/PuntoRecepcion";
import { NotFound } from "@/pages/NotFound";
import { Public_prestamos } from "@/pages/Public_prestamos";
import { NotificacionesPublicas } from "@/pages/NotificacionesPublicas";

const pages = [
  { path: "inicio", element: <Inicio /> },
  { path: "punto-prestamos", element: <PuntoPrestamos /> },
  { path: "punto-recepcion", element: <PuntoRecepcion /> },
  { path: "herramientas", element: <Herramientas /> },
  { path: "combinadas", element: <Combinadas /> },
  { path: "categorias", element: <Categorias /> },
  { path: "ubicaciones", element: <Ubicaciones /> },
  { path: "marcas", element: <Marcas /> },
  { path: "historial-prestamos", element: <HistorialPrestamos /> },
  { path: "historial-recepcion", element: <HistorialRecepcion /> },
  { path: "mecanicos", element: <Mecanicos /> },
  { path: "clientes", element: <Clientes /> },
  { path: "notificaciones-publicas", element: <NotificacionesPublicas /> },
];

export const router = createBrowserRouter([
  {
    path: "/public-prestamos",
    element: <Public_prestamos />,
  },
  {
    element: <RequireGuest />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Inicio />,
          },
          ...pages,
          {
            element: <RequireAdmin />,
            children: [
              { path: "usuarios", element: <Usuarios /> },
              { path: "backup", element: <Backup /> },
            ],
          },
          {
            path: "*",
            element: <NotFound />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
