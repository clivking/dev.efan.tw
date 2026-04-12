select 'customers' as table_name, count(*) from customers
union all
select 'quotes', count(*) from quotes
union all
select 'quote_items', count(*) from quote_items
union all
select 'contacts', count(*) from contacts
union all
select 'products', count(*) from products
union all
select 'company_names', count(*) from company_names;
