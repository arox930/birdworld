import { useState } from "react";
import { Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExpensesList } from "@/components/dashboard/ExpensesList";
import { DashboardFiltersBar } from "@/components/dashboard/DashboardFilters";
import type { DashboardFilters } from "@/hooks/useDashboardData";

const defaultFilters: DashboardFilters = {
  dateFrom: null,
  dateTo: null,
  birdSpecies: null,
};

export default function Gastos() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            {t("expenses.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("expenses.subtitle")}</p>
        </div>
      </div>
      <DashboardFiltersBar filters={filters} onChange={setFilters} />
      <ExpensesList filters={filters} />
    </div>
  );
}
