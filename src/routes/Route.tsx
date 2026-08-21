import { createBrowserRouter } from "react-router-dom";

import { RequireAdmin, RequireAuth, RequireGuest } from "@/components/auth-guards";
import { MainLayout } from "@/components/MainLayout";

import { Login } from "@/pages/Login";
import { Inicio } from "@/pages/Inicio";
import { Usuarios } from "@/pages/Usuarios";
import { Backup } from "@/pages/Backup";
import { PuntoPrestamos } from "@/pages/PuntoPrestamos";
import { Herramientas } from "@/pages/Herramientas";
import { Categorias } from "@/pages/Categorias";
import { Ubicaciones } from "@/pages/Ubicaciones";
import { Marcas } from "@/pages/Marcas";
import { Mecanicos } from "@/pages/Mecanicos";

const pages = [
  { path: "inicio", element: <Inicio /> },
  { path: "punto-prestamos", element: <PuntoPrestamos /> },
  { path: "herramientas", element: <Herramientas /> },
  { path: "categorias", element: <Categorias /> },
  { path: "ubicaciones", element: <Ubicaciones /> },
  { path: "marcas", element: <Marcas /> },
  { path: "mecanicos", element: <Mecanicos /> },
];

export const router = createBrowserRouter([
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
        ],
      },
    ],
  },
]);
