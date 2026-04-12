select
  table_name,
  pg_total_relation_size(format('%I', table_name)) as bytes
from information_schema.tables
where table_schema = 'public'
order by bytes desc
limit 20;
