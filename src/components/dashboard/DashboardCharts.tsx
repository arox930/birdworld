import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { getSpeciesDisplayName } from "@/lib/speciesNames";
import { useTranslation } from "react-i18next";

const COLORS = [
  "hsl(25, 85%, 45%)",
  "hsl(145, 40%, 42%)",
  "hsl(210, 80%, 52%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(180, 50%, 45%)",
  "hsl(60, 70%, 45%)",
];

type ChartData = { month: string; value: number }[];
type PieData = { name: string; value: number }[];

type Props = {
  monthlyRevenue: ChartData;
  monthlyExpenses: ChartData;
  monthlySales: ChartData;
  monthlyBirths: ChartData;
  monthlyDeaths: ChartData;
  sexDistribution: PieData;
  speciesDistribution: PieData;
  birdRevenue: number;
  birdExpenses: number;
};

export function DashboardCharts({
  monthlyRevenue, monthlyExpenses, monthlySales, monthlyBirths, monthlyDeaths,
  sexDistribution, speciesDistribution, birdRevenue, birdExpenses,
}: Props) {
  const { t } = useTranslation();
  const revenueVsExpenses = mergeRevenueExpenses(monthlyRevenue, monthlyExpenses);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {(monthlyRevenue.length > 0 || monthlyExpenses.length > 0) && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.revenueVsExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 11 }} tickFormatter={v => `${v}€`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} formatter={(v: number, name: string) => [`${v.toFixed(2)} €`, name === "ingresos" ? t("dashboard.revenue") : t("dashboard.expenses")]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === "ingresos" ? t("dashboard.revenue") : t("dashboard.expenses")} />
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145, 40%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(145, 40%, 42%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="ingresos" stroke="hsl(145, 40%, 42%)" fill="url(#revenueGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="gastos" stroke="hsl(0, 72%, 51%)" fill="url(#expensesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {monthlySales.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("dashboard.monthlySales")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(145, 40%, 42%)" radius={[4, 4, 0, 0]} name={t("dashboard.sales")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {(monthlyBirths.length > 0 || monthlyDeaths.length > 0) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("dashboard.birthsAndDeaths")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergeMonthlyData(monthlyBirths, monthlyDeaths)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="nacimientos" stroke="hsl(145, 40%, 42%)" strokeWidth={2} dot={{ r: 3 }} name={t("dashboard.births")} />
                  <Line type="monotone" dataKey="muertes" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name={t("dashboard.deaths")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {sexDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("dashboard.sexDistribution")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sexDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sexDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {speciesDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("dashboard.speciesDistribution")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speciesDistribution.map(s => ({ ...s, name: getSpeciesDisplayName(s.name) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(25, 85%, 45%)" radius={[0, 4, 4, 0]} name={t("dashboard.specimens")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function mergeMonthlyData(births: ChartData, deaths: ChartData) {
  const map: Record<string, { month: string; nacimientos: number; muertes: number }> = {};
  births.forEach(b => { map[b.month] = { month: b.month, nacimientos: b.value, muertes: 0 }; });
  deaths.forEach(d => {
    if (map[d.month]) map[d.month].muertes = d.value;
    else map[d.month] = { month: d.month, nacimientos: 0, muertes: d.value };
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

function mergeRevenueExpenses(revenue: ChartData, expenses: ChartData) {
  const map: Record<string, { month: string; ingresos: number; gastos: number }> = {};
  revenue.forEach(r => { map[r.month] = { month: r.month, ingresos: r.value, gastos: 0 }; });
  expenses.forEach(e => {
    if (map[e.month]) map[e.month].gastos = e.value;
    else map[e.month] = { month: e.month, ingresos: 0, gastos: e.value };
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}
