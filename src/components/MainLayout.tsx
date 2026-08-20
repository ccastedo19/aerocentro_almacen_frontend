import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Separator } from "./ui/separator";

export const MainLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 items-center border-b px-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger />

                <Separator
                orientation="vertical"
                className="relative top-[3px] mr-4 h-5"
                />
            </div>

            <Breadcrumbs />
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}