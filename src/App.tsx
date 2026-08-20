import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Route";

export default function App() {
  return <RouterProvider router={router} />;
}