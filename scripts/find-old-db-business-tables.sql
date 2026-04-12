select tablename
from pg_tables
where schemaname = 'public'
  and (
    tablename ilike '%customer%'
    or tablename ilike '%client%'
    or tablename ilike '%quote%'
    or tablename ilike '%invoice%'
    or tablename ilike '%order%'
    or tablename ilike '%project%'
    or tablename ilike '%company%'
    or tablename ilike '%contact%'
  )
order by tablename;
