import { useState } from "react";
import { LayoutDashboard, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardFiltersBar } from "@/components/dashboard/DashboardFilters";
import { KPICards } from "@/components/dashboard/KPICards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ExpenseFormDialog } from "@/components/dashboard/ExpenseFormDialog";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";

const defaultFilters: DashboardFilters = {
  dateFrom: null,
  dateTo: null,
  birdSpecies: null,
};

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardData(filters);
  const { t } = useTranslation();

  const stats = data ?? {
    totalBirds: 0, aliveBirds: 0,
    deadBirds: 0, soldBirds: 0,
    totalRevenue: 0, birdRevenue: 0,
    totalExpenses: 0, birdExpenses: 0, netProfit: 0,
    monthlyRevenue: [], monthlyExpenses: [], monthlySales: [], monthlyBirths: [], monthlyDeaths: [],
    sexDistribution: [], speciesDistribution: [],
    totalSold: 0, totalDead: 0, mortalityRate: 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/app/gastos")} variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {t("dashboard.viewExpenses")}
          </Button>
          <Button onClick={() => setExpenseOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("dashboard.addExpense")}
          </Button>
        </div>
      </div>

      <DashboardFiltersBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground animate-pulse">
          {t("dashboard.loadingData")}
        </div>
      ) : (
        <>
          <KPICards stats={stats} isLoading={isLoading} />
          <DashboardCharts
            monthlyRevenue={stats.monthlyRevenue}
            monthlyExpenses={stats.monthlyExpenses}
            monthlySales={stats.monthlySales}
            monthlyBirths={stats.monthlyBirths}
            monthlyDeaths={stats.monthlyDeaths}
            sexDistribution={stats.sexDistribution}
            speciesDistribution={stats.speciesDistribution}
            birdRevenue={stats.birdRevenue}
            birdExpenses={stats.birdExpenses}
          />
        </>
      )}

      <ExpenseFormDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  );
}
