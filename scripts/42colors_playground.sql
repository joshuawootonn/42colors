select count(*) from pixels;
select count(*) from users u;



ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX users_email_index ON public.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

select * from pixels as p ORDER BY p.inserted_at DESC
 limit 100;	


UPDATE pixels SET x = x / 5;
UPDATE pixels
SET y = y / 5;


select * from "users" ;
select * from accounts a ;
select count(*) from pixels;


    UPDATE pixels
    SET user_id = (
        SELECT id
        FROM users
        WHERE email = 'joshuawootonn@gmail.com'  
    )
    
    
select 'drop table "' || tablename || '" cascade;' 
from pg_tables where schemaname = 'public';


select * from "users";
select * from "users_tokens";
select count(*) from "pixels";
select * from "plots";

select * from "logs";
SELECT PostGIS_Version();



select * from logs;

select * from users;



WITH target_polygon AS (
  SELECT ST_GeomFromText('POLYGON((-27 255, -36 255, -36 200, -12 200, -12 240, -27 240, -27 255))', 4326) as poly
)
SELECT 
  *
FROM pixels p, target_polygon tp
WHERE ST_Contains(tp.poly, ST_SetSRID(ST_MakePoint(p.x, p.y), 4326))
  and inserted_at < '2025-10-11 22:27:10.000'
  and inserted_at > '2025-10-09 01:36:30.000'
ORDER BY inserted_at desc;





select count(*) from "pixels"; 
select count(*) from pixels where user_id is not null; --order by inserted_at desc;
where inserted_at < '2025-10-11 22:27:10.000'
  and inserted_at > '2025-10-09 01:36:30.000';

