import { useState } from "react";
import { LayoutDashboard, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DashboardFiltersBar } from "@/components/dashboard/DashboardFilters";
import { KPICards } from "@/components/dashboard/KPICards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ExpenseFormDialog } from "@/components/dashboard/ExpenseFormDialog";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";

const defaultFilters: DashboardFilters = {
  dateFrom: null,
  dateTo: null,
  animalType: "all",
  birdSpecies: null,
  dogBreed: null,
};

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardData(filters);

  const stats = data ?? {
    totalBirds: 0, totalDogs: 0, aliveBirds: 0, aliveDogs: 0,
    deadBirds: 0, deadDogs: 0, soldBirds: 0, soldDogs: 0,
    totalRevenue: 0, birdRevenue: 0, dogRevenue: 0,
    totalExpenses: 0, birdExpenses: 0, dogExpenses: 0, netProfit: 0,
    monthlyRevenue: [], monthlyExpenses: [], monthlySales: [], monthlyBirths: [], monthlyDeaths: [],
    sexDistribution: [], speciesDistribution: [], breedDistribution: [],
    totalLitterPups: 0, totalLitterDeaths: 0, mortalityRate: 0,
    totalSold: 0, totalDead: 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Resumen general del criadero</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/app/gastos")} variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            Ver gastos
          </Button>
          <Button onClick={() => setExpenseOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir gasto
          </Button>
        </div>
      </div>

      <DashboardFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground animate-pulse">
          Cargando datos...
        </div>
      ) : (
        <>
          <KPICards stats={stats} isLoading={isLoading} animalType={filters.animalType} />
          <DashboardCharts
            monthlyRevenue={stats.monthlyRevenue}
            monthlyExpenses={stats.monthlyExpenses}
            monthlySales={stats.monthlySales}
            monthlyBirths={stats.monthlyBirths}
            monthlyDeaths={stats.monthlyDeaths}
            sexDistribution={stats.sexDistribution}
            speciesDistribution={stats.speciesDistribution}
            breedDistribution={stats.breedDistribution}
            birdRevenue={stats.birdRevenue}
            dogRevenue={stats.dogRevenue}
            birdExpenses={stats.birdExpenses}
            dogExpenses={stats.dogExpenses}
            animalType={filters.animalType}
          />
        </>
      )}

      <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  );
}
