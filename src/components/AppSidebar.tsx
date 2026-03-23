import { LayoutDashboard, Map, Users, FileText, Bird } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logoImg from "@/assets/logo.png";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Aves", url: "/app/aves", icon: Bird },
  { title: "Compradores", url: "/app/compradores", icon: Users },
  { title: "Mapa", url: "/app/mapa", icon: Map },
  { title: "Plantillas de Cesión", url: "/app/plantillas-cesion", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
            <img src={logoImg} alt="BirdWorld" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground" style={{ fontFamily: "'Space Grotesk', system-ui" }}>
              BirdWorld
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
