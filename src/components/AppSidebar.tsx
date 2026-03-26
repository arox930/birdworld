import { LayoutDashboard, Map, Users, FileText, Bird, Mail } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logoImg from "@/assets/logo.png";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  { titleKey: "nav.dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.birds", url: "/app/aves", icon: Bird },
  { titleKey: "nav.buyers", url: "/app/compradores", icon: Users },
  { titleKey: "nav.map", url: "/app/mapa", icon: Map },
  { titleKey: "nav.cessionTemplates", url: "/app/plantillas-cesion", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col items-center px-2 py-3">
          <div className="flex items-center justify-center overflow-hidden">
            <img src={logoImg} alt="BirdWorld" className="w-20 h-20 object-contain" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground mt-1" style={{ fontFamily: "'Space Grotesk', system-ui" }}>
              BirdWorld
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={t(item.titleKey)}
                  >
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <a
          href="mailto:aaronalmeria@gmail.com"
          className="flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>aaronalmeria@gmail.com</span>}
        </a>
      </div>
    </Sidebar>
  );
}
