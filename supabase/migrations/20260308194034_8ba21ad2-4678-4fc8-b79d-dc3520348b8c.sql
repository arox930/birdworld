
DROP POLICY "Auth users full access expenses" ON public.expenses;

CREATE POLICY "Auth users full access expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
