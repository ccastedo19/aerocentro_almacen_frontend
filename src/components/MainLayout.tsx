import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NotificationsMenu } from "@/components/notifications-menu";
import { NavbarUserMenu } from "@/components/user-menu";
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
                className="hidden h-10 mr-4 sm:block"
                />
            </div>

            <Breadcrumbs />

            <div className="ml-auto flex items-center gap-1 pl-4 sm:gap-2">
                <NotificationsMenu />

                <Separator
                orientation="vertical"
                className="hidden h-10 sm:block"
                />

                <NavbarUserMenu />
            </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}