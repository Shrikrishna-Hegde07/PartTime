DROP POLICY IF EXISTS "Student details viewable by authenticated" ON public.student_details;

CREATE POLICY "Students see own details"
ON public.student_details FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Clients see applicants details"
ON public.student_details FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  WHERE a.student_id = student_details.user_id
    AND j.client_id = auth.uid()
));

CREATE POLICY "Admins see all student details"
ON public.student_details FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));