import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/components/auth-provider";

import { router } from "./routes/Route";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}