import { Bird, Dog, DollarSign, Skull, ShoppingCart, TrendingUp, Wallet, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  totalBirds: number;
  totalDogs: number;
  aliveBirds: number;
  aliveDogs: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalSold: number;
  totalDead: number;
  mortalityRate: number;
  totalLitterPups: number;
};

type Props = {
  stats: Stats;
  isLoading: boolean;
  animalType: "all" | "bird" | "dog";
};

export function KPICards({ stats, isLoading, animalType }: Props) {
  const v = (val: number | string) => isLoading ? "…" : String(val);

  const cards = [
    {
      label: "Ingresos totales",
      value: v(`${stats.totalRevenue.toFixed(2)} €`),
      icon: DollarSign,
      color: "text-primary",
      show: true,
    },
    {
      label: "Gastos totales",
      value: v(`${stats.totalExpenses.toFixed(2)} €`),
      icon: Wallet,
      color: "text-destructive",
      show: true,
    },
    {
      label: "Beneficio neto",
      value: v(`${stats.netProfit.toFixed(2)} €`),
      icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats.netProfit >= 0 ? "text-accent" : "text-destructive",
      show: true,
    },
    {
      label: "Ventas",
      value: v(stats.totalSold),
      icon: ShoppingCart,
      color: "text-accent",
      show: true,
    },
    {
      label: "Aves vivas",
      value: v(stats.aliveBirds),
      icon: Bird,
      color: "text-accent",
      show: animalType !== "dog",
    },
    {
      label: "Perros vivos",
      value: v(stats.aliveDogs),
      icon: Dog,
      color: "text-primary",
      show: animalType !== "bird",
    },
    {
      label: "Total aves",
      value: v(stats.totalBirds),
      icon: Bird,
      color: "text-muted-foreground",
      show: animalType !== "dog",
    },
    {
      label: "Total perros",
      value: v(stats.totalDogs),
      icon: Dog,
      color: "text-muted-foreground",
      show: animalType !== "bird",
    },
    {
      label: "Fallecidos",
      value: v(stats.totalDead),
      icon: Skull,
      color: "text-destructive",
      show: true,
    },
    {
      label: "Tasa mortalidad",
      value: v(`${stats.mortalityRate.toFixed(1)}%`),
      icon: TrendingUp,
      color: "text-destructive",
      show: true,
    },
  ].filter(c => c.show);

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
      {cards.map((stat) => (
        <Card key={stat.label} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold tracking-tight">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

