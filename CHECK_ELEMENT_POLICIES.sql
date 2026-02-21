SELECT 
  tablename,
  policyname,
  roles,
  cmd as operation,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'script_elements'
ORDER BY policyname;
