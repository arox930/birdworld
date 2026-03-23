import { Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExpensesList } from "@/components/dashboard/ExpensesList";

export default function Gastos() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Gastos
          </h1>
          <p className="text-muted-foreground text-sm">Listado de gastos registrados</p>
        </div>
      </div>
      <ExpensesList />
    </div>
  );
}
