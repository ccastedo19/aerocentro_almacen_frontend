import { createBrowserRouter } from "react-router-dom";

import { MainLayout } from "@/components/MainLayout";

import { Login } from "@/pages/Login";
import { Inicio } from "@/pages/Inicio";
import { Usuarios } from "@/pages/Usuarios";
import { Backup } from "@/pages/Backup";
import { PuntoPrestamos } from "@/pages/PuntoPrestamos";
import { Herramientas } from "@/pages/Herramientas";
import { Categorias } from "@/pages/Categorias";
import { Ubicaciones } from "@/pages/Ubicaciones";
import { Mecanicos } from "@/pages/Mecanicos";

const pages = [
  { path: "inicio", element: <Inicio /> },
  { path: "punto-prestamos", element: <PuntoPrestamos /> },
  { path: "herramientas", element: <Herramientas /> },
  { path: "categorias", element: <Categorias /> },
  { path: "ubicaciones", element: <Ubicaciones /> },
  { path: "mecanicos", element: <Mecanicos /> },
  { path: "usuarios", element: <Usuarios /> },
  { path: "backup", element: <Backup /> },
];

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Inicio />,
      },
      ...pages,
    ],
  },
]);