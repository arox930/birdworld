import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DashboardFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  animalType: "all" | "bird" | "dog";
  birdSpecies: string | null;
  dogBreed: string | null;
};

export function useDashboardData(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard-data", filters],
    queryFn: async () => {
      const { dateFrom, dateTo, animalType, birdSpecies } = filters;

      // Fetch all data in parallel
      const [birdsRes, dogsRes, cessionsRes, littersRes, expensesRes] = await Promise.all([
        supabase.from("birds").select("id, especie, sexo, fecha_nacimiento, fecha_muerte, fecha_cesion, pareja_id, created_at"),
        supabase.from("dogs").select("id, raza, sexo, fecha_nacimiento, fecha_muerte, fecha_cesion, created_at"),
        supabase.from("cessions").select("id, precio, animal_type, fecha_cesion, animal_id"),
        supabase.from("litters").select("id, fecha, nacidos_total, muertos_parto, machos, hembras, mother_dog_id"),
        supabase.from("expenses").select("id, monto, fecha, animal_type, categoria, subcategoria"),
      ]);

      let birds = birdsRes.data ?? [];
      let dogs = dogsRes.data ?? [];
      let cessions = cessionsRes.data ?? [];
      const litters = littersRes.data ?? [];
      let expenses = expensesRes.data ?? [];

      // Filter by animal type
      if (animalType === "bird") {
        dogs = [];
        cessions = cessions.filter(c => c.animal_type === "bird");
        expenses = expenses.filter(e => e.animal_type === "bird");
      } else if (animalType === "dog") {
        birds = [];
        cessions = cessions.filter(c => c.animal_type === "dog");
        expenses = expenses.filter(e => e.animal_type === "dog");
      }

      // Filter birds by species
      if (birdSpecies) {
        birds = birds.filter(b => b.especie === birdSpecies);
        const birdIds = new Set(birds.map(b => b.id));
        cessions = cessions.filter(c => c.animal_type !== "bird" || birdIds.has(c.animal_id));
        expenses = expenses.filter(e => e.animal_type !== "bird" || e.categoria === birdSpecies);
      }

      // Filter dogs by breed
      if (filters.dogBreed) {
        dogs = dogs.filter(d => d.raza === filters.dogBreed);
        const dogIds = new Set(dogs.map(d => d.id));
        cessions = cessions.filter(c => c.animal_type !== "dog" || dogIds.has(c.animal_id));
        expenses = expenses.filter(e => e.animal_type !== "dog" || e.categoria === filters.dogBreed);
      }

      // Date filtering
      const inRange = (date: string | null) => {
        if (!date) return false;
        if (dateFrom && date < dateFrom) return false;
        if (dateTo && date > dateTo) return false;
        return true;
      };

      // KPIs
      const totalBirds = birds.length;
      const totalDogs = dogs.length;
      const aliveBirds = birds.filter(b => !b.fecha_muerte && !b.fecha_cesion).length;
      const aliveDogs = dogs.filter(d => !d.fecha_muerte && !d.fecha_cesion).length;
      const deadBirds = birds.filter(b => b.fecha_muerte && (!dateFrom && !dateTo || inRange(b.fecha_muerte))).length;
      const deadDogs = dogs.filter(d => d.fecha_muerte && (!dateFrom && !dateTo || inRange(d.fecha_muerte))).length;
      const soldBirds = birds.filter(b => b.fecha_cesion && (!dateFrom && !dateTo || inRange(b.fecha_cesion))).length;
      const soldDogs = dogs.filter(d => d.fecha_cesion && (!dateFrom && !dateTo || inRange(d.fecha_cesion))).length;

      const filteredCessions = (dateFrom || dateTo)
        ? cessions.filter(c => inRange(c.fecha_cesion))
        : cessions;

      const filteredExpenses = (dateFrom || dateTo)
        ? expenses.filter(e => inRange(e.fecha))
        : expenses;

      const totalRevenue = filteredCessions.reduce((sum, c) => sum + Number(c.precio), 0);
      const birdRevenue = filteredCessions.filter(c => c.animal_type === "bird").reduce((s, c) => s + Number(c.precio), 0);
      const dogRevenue = filteredCessions.filter(c => c.animal_type === "dog").reduce((s, c) => s + Number(c.precio), 0);

      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.monto), 0);
      const birdExpenses = filteredExpenses.filter(e => e.animal_type === "bird").reduce((s, e) => s + Number(e.monto), 0);
      const dogExpenses = filteredExpenses.filter(e => e.animal_type === "dog").reduce((s, e) => s + Number(e.monto), 0);

      const netProfit = totalRevenue - totalExpenses;

      // Monthly revenue for chart (last 12 months or filtered range)
      const monthlyRevenue = getMonthlyData(filteredCessions, c => Number(c.precio), c => c.fecha_cesion);

      // Monthly expenses
      const monthlyExpenses = getMonthlyData(filteredExpenses, e => Number(e.monto), e => e.fecha);

      // Monthly sales count
      const monthlySales = getMonthlyCount(filteredCessions, c => c.fecha_cesion);

      // Monthly births
      const birthItems = [
        ...birds.map(b => ({ date: b.fecha_nacimiento, type: "bird" as const })),
        ...dogs.map(d => ({ date: d.fecha_nacimiento, type: "dog" as const })),
      ].filter(item => !dateFrom && !dateTo || inRange(item.date));
      const monthlyBirths = getMonthlyCount(birthItems, i => i.date);

      // Monthly deaths
      const deathItems = [
        ...birds.filter(b => b.fecha_muerte).map(b => ({ date: b.fecha_muerte!, type: "bird" as const })),
        ...dogs.filter(d => d.fecha_muerte).map(d => ({ date: d.fecha_muerte!, type: "dog" as const })),
      ].filter(item => !dateFrom && !dateTo || inRange(item.date));
      const monthlyDeaths = getMonthlyCount(deathItems, i => i.date);

      // Sex distribution
      const sexDistribution = [
        { name: "Machos", value: [...birds, ...dogs].filter(a => a.sexo === "Macho").length },
        { name: "Hembras", value: [...birds, ...dogs].filter(a => a.sexo === "Hembra").length },
        { name: "Desconocido", value: [...birds, ...dogs].filter(a => a.sexo === "Desconocido").length },
      ].filter(s => s.value > 0);

      // Species distribution (birds only)
      const speciesCount: Record<string, number> = {};
      birds.forEach(b => { speciesCount[b.especie] = (speciesCount[b.especie] || 0) + 1; });
      const speciesDistribution = Object.entries(speciesCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Breed distribution (dogs only)
      const breedCount: Record<string, number> = {};
      dogs.forEach(d => { breedCount[d.raza] = (breedCount[d.raza] || 0) + 1; });
      const breedDistribution = Object.entries(breedCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Litters stats
      const filteredLitters = (dateFrom || dateTo)
        ? litters.filter(l => inRange(l.fecha))
        : litters;
      const totalLitterPups = filteredLitters.reduce((s, l) => s + l.nacidos_total, 0);
      const totalLitterDeaths = filteredLitters.reduce((s, l) => s + l.muertos_parto, 0);

      // Mortality rate
      const totalAnimals = totalBirds + totalDogs;
      const totalDead = deadBirds + deadDogs;
      const mortalityRate = totalAnimals > 0 ? (totalDead / totalAnimals) * 100 : 0;

      return {
        totalBirds, totalDogs, aliveBirds, aliveDogs,
        deadBirds, deadDogs, soldBirds, soldDogs,
        totalRevenue, birdRevenue, dogRevenue,
        totalExpenses, birdExpenses, dogExpenses, netProfit,
        monthlyRevenue, monthlyExpenses, monthlySales, monthlyBirths, monthlyDeaths,
        sexDistribution, speciesDistribution, breedDistribution,
        totalLitterPups, totalLitterDeaths, mortalityRate,
        totalSold: soldBirds + soldDogs,
        totalDead,
      };
    },
  });
}

function getMonthlyData<T>(items: T[], getValue: (item: T) => number, getDate: (item: T) => string): { month: string; value: number }[] {
  const map: Record<string, number> = {};
  items.forEach(item => {
    const d = getDate(item);
    if (!d) return;
    const key = d.substring(0, 7); // YYYY-MM
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

