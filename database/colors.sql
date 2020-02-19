
drop table if exists line;
drop table if exists player;

create table player
(
  player_id SERIAL PRIMARY KEY,
  name character varying(20),

  created_at timestamp NOT NULL DEFAULT NOW()
);

create table line 
(
  line_id SERIAL PRIMARY KEY,  
  geom geometry(LineString,4326) NOT NULL,
  duration int NOT NULL DEFAULT 0,
  brushColor character varying(20) NOT NULL,
  brushWidth double precision NOT NULL,
  
  created_at timestamp NOT NULL DEFAULT NOW(),

  player_id integer
);


-- connect line to user
alter table line 
    add constraint fk_line_player
    foreign key (player_id) 
    REFERENCES player (player_id);

CREATE INDEX lines_geom_idx
    ON line USING gist
    (geom)
    TABLESPACE pg_default;