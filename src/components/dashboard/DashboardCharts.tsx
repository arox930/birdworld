import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { getSpeciesDisplayName } from "@/lib/speciesNames";

const COLORS = [
  "hsl(25, 85%, 45%)",   // primary
  "hsl(145, 40%, 42%)",  // accent
  "hsl(210, 80%, 52%)",  // info
  "hsl(38, 92%, 50%)",   // warning
  "hsl(0, 72%, 51%)",    // destructive
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
  breedDistribution: PieData;
  birdRevenue: number;
  dogRevenue: number;
  birdExpenses: number;
  dogExpenses: number;
  animalType: "all" | "bird" | "dog";
};

export function DashboardCharts({
  monthlyRevenue, monthlyExpenses, monthlySales, monthlyBirths, monthlyDeaths,
  sexDistribution, speciesDistribution, breedDistribution,
  birdRevenue, dogRevenue, birdExpenses, dogExpenses, animalType,
}: Props) {
  const revenueByType = [
    ...(animalType !== "dog" ? [{ name: "Aves", value: birdRevenue }] : []),
    ...(animalType !== "bird" ? [{ name: "Perros", value: dogRevenue }] : []),
  ].filter(d => d.value > 0);

  const expensesByType = [
    ...(animalType !== "dog" ? [{ name: "Aves", value: birdExpenses }] : []),
    ...(animalType !== "bird" ? [{ name: "Perros", value: dogExpenses }] : []),
  ].filter(d => d.value > 0);

  // Merge revenue and expenses for combined chart
  const revenueVsExpenses = mergeRevenueExpenses(monthlyRevenue, monthlyExpenses);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Revenue vs Expenses over time */}
      {(monthlyRevenue.length > 0 || monthlyExpenses.length > 0) && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos vs Gastos mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 11 }} tickFormatter={v => `${v}€`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v.toFixed(2)} €`, name === "ingresos" ? "Ingresos" : "Gastos"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === "ingresos" ? "Ingresos" : "Gastos"} />
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

      {/* Sales count */}
      {monthlySales.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(145, 40%, 42%)" radius={[4, 4, 0, 0]} name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Births & Deaths */}
      {(monthlyBirths.length > 0 || monthlyDeaths.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nacimientos y muertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergeMonthlyData(monthlyBirths, monthlyDeaths)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="nacimientos" stroke="hsl(145, 40%, 42%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="muertes" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sex distribution */}
      {sexDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por sexo</CardTitle>
          </CardHeader>
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

      {/* Expenses by type */}
      {expensesByType.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value.toFixed(0)}€`}>
                    {expensesByType.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} formatter={(v: number) => `${v.toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by type */}
      {revenueByType.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value.toFixed(0)}€`}>
                    {revenueByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} formatter={(v: number) => `${v.toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Species distribution */}
      {speciesDistribution.length > 0 && animalType !== "dog" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por especie (aves)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speciesDistribution.map(s => ({ ...s, name: getSpeciesDisplayName(s.name) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(25, 85%, 45%)" radius={[0, 4, 4, 0]} name="Ejemplares" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breed distribution */}
      {breedDistribution.length > 0 && animalType !== "bird" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribución por raza (perros)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breedDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(30, 8%, 46%)", fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(40, 25%, 97%)", border: "1px solid hsl(35, 15%, 88%)", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(210, 80%, 52%)" radius={[0, 4, 4, 0]} name="Ejemplares" />
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
