import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useLicense } from "@/hooks/useLicense";
import Dashboard from "./pages/Dashboard";
import Aves from "./pages/Aves";
import Gastos from "./pages/Gastos";
import Compradores from "./pages/Compradores";
import Mapa from "./pages/Mapa";
import PlantillasCesion from "./pages/PlantillasCesion";
import LicenseGate from "./pages/LicenseGate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLicensed, isLoading } = useLicense();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isLicensed) {
    return (
      <Routes>
        <Route path="*" element={<LicenseGate />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/app" element={<AppLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="aves" element={<Aves />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="compradores" element={<Compradores />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="plantillas-cesion" element={<PlantillasCesion />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
