import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { ExpenseFormDialog, type Expense } from "./ExpenseFormDialog";
import { useTranslation } from "react-i18next";
import type { DashboardFilters } from "@/hooks/useDashboardData";

type Props = {
  filters?: DashboardFilters;
};

export function ExpensesList({ filters }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ["expenses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const expenses = useMemo(() => {
    if (!filters) return allExpenses;
    return allExpenses.filter((e) => {
      if (filters.dateFrom && e.fecha < filters.dateFrom) return false;
      if (filters.dateTo && e.fecha > filters.dateTo) return false;
      if (filters.birdSpecies && e.categoria !== filters.birdSpecies) return false;
      return true;
    });
  }, [allExpenses, filters]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("expenses.expenseDeleted"));
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
    onError: (err: Error) => toast.error("Error: " + err.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground animate-pulse">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
          {t("expenses.noExpenses")}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t("expenses.registeredExpenses")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {expense.monto.toFixed(2)} €
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t("birds.bird")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {expense.animal_type === "bird"
                      ? getSpeciesDisplayName(expense.categoria)
                      : expense.categoria}
                    {expense.subcategoria && ` · ${expense.subcategoria}`}
                    {expense.descripcion && ` — ${expense.descripcion}`}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    {new Date(expense.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingExpense(expense as Expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(expense.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={!!editingExpense}
        onOpenChange={(o) => !o && setEditingExpense(null)}
        expense={editingExpense}
      />
    </>
  );
}
