import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  birdSpecies: string | null;
};

export function useDashboardData(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard-data", filters],
    queryFn: async () => {
      const { dateFrom, dateTo, birdSpecies } = filters;

      const [birdsRes, cessionsRes, expensesRes] = await Promise.all([
        supabase.from("birds").select("id, especie, sexo, fecha_nacimiento, fecha_muerte, fecha_cesion, pareja_id, created_at"),
        supabase.from("cessions").select("id, precio, animal_type, fecha_cesion, animal_id").eq("animal_type", "bird"),
        supabase.from("expenses").select("id, monto, fecha, animal_type, categoria, subcategoria").eq("animal_type", "bird"),
      ]);

      let birds = birdsRes.data ?? [];
      let cessions = cessionsRes.data ?? [];
      let expenses = expensesRes.data ?? [];

      if (birdSpecies) {
        birds = birds.filter(b => b.especie === birdSpecies);
        const birdIds = new Set(birds.map(b => b.id));
        cessions = cessions.filter(c => birdIds.has(c.animal_id));
        expenses = expenses.filter(e => e.categoria === birdSpecies);
      }

      const inRange = (date: string | null) => {
        if (!date) return false;
        if (dateFrom && date < dateFrom) return false;
        if (dateTo && date > dateTo) return false;
        return true;
      };

      const totalBirds = birds.length;
      const aliveBirds = birds.filter(b => !b.fecha_muerte && !b.fecha_cesion).length;
      const deadBirds = birds.filter(b => b.fecha_muerte && (!dateFrom && !dateTo || inRange(b.fecha_muerte))).length;
      const soldBirds = birds.filter(b => b.fecha_cesion && (!dateFrom && !dateTo || inRange(b.fecha_cesion))).length;

      const filteredCessions = (dateFrom || dateTo)
        ? cessions.filter(c => inRange(c.fecha_cesion))
        : cessions;

      const filteredExpenses = (dateFrom || dateTo)
        ? expenses.filter(e => inRange(e.fecha))
        : expenses;

      const totalRevenue = filteredCessions.reduce((sum, c) => sum + Number(c.precio), 0);
      const birdRevenue = totalRevenue;

      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.monto), 0);
      const birdExpenses = totalExpenses;

      const netProfit = totalRevenue - totalExpenses;

      const monthlyRevenue = getMonthlyData(filteredCessions, c => Number(c.precio), c => c.fecha_cesion);
      const monthlyExpenses = getMonthlyData(filteredExpenses, e => Number(e.monto), e => e.fecha);
      const monthlySales = getMonthlyCount(filteredCessions, c => c.fecha_cesion);

      const birthItems = birds.map(b => ({ date: b.fecha_nacimiento }))
        .filter(item => !dateFrom && !dateTo || inRange(item.date));
      const monthlyBirths = getMonthlyCount(birthItems, i => i.date);

      const deathItems = birds.filter(b => b.fecha_muerte).map(b => ({ date: b.fecha_muerte! }))
        .filter(item => !dateFrom && !dateTo || inRange(item.date));
      const monthlyDeaths = getMonthlyCount(deathItems, i => i.date);

      const sexDistribution = [
        { name: "Machos", value: birds.filter(a => a.sexo === "Macho").length },
        { name: "Hembras", value: birds.filter(a => a.sexo === "Hembra").length },
        { name: "Desconocido", value: birds.filter(a => a.sexo === "Desconocido").length },
      ].filter(s => s.value > 0);

      const speciesCount: Record<string, number> = {};
      birds.forEach(b => { speciesCount[b.especie] = (speciesCount[b.especie] || 0) + 1; });
      const speciesDistribution = Object.entries(speciesCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const totalDead = deadBirds;
      const mortalityRate = totalBirds > 0 ? (totalDead / totalBirds) * 100 : 0;

      return {
        totalBirds, aliveBirds,
        deadBirds, soldBirds,
        totalRevenue, birdRevenue,
        totalExpenses, birdExpenses, netProfit,
        monthlyRevenue, monthlyExpenses, monthlySales, monthlyBirths, monthlyDeaths,
        sexDistribution, speciesDistribution,
        totalSold: soldBirds,
        totalDead,
        mortalityRate,
      };
    },
  });
}

function getMonthlyData<T>(items: T[], getValue: (item: T) => number, getDate: (item: T) => string): { month: string; value: number }[] {
  const map: Record<string, number> = {};
  items.forEach(item => {
    const d = getDate(item);
    if (!d) return;
    const key = d.substring(0, 7);
    map[key] = (map[key] || 0) + getValue(item);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, value]) => ({ month: formatMonth(month), value }));
}

function getMonthlyCount<T>(items: T[], getDate: (item: T) => string): { month: string; value: number }[] {
  const map: Record<string, number> = {};
  items.forEach(item => {
    const d = getDate(item);
    if (!d) return;
    const key = d.substring(0, 7);
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, value]) => ({ month: formatMonth(month), value }));
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}
