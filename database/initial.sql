PGDMP     %    !                x            colors    12.2    12.0     p           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            q           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            r           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            s           1262    17520    colors    DATABASE     �   CREATE DATABASE colors WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252';
    DROP DATABASE colors;
                postgres    false                        3079    17548    postgis 	   EXTENSION     ;   CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
    DROP EXTENSION postgis;
                   false            t           0    0    EXTENSION postgis    COMMENT     g   COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';
                        false    2            �            1259    18586    line    TABLE     P  CREATE TABLE public.line (
    line_id integer NOT NULL,
    geom public.geometry(MultiLineString,4326) NOT NULL,
    duration integer DEFAULT 0 NOT NULL,
    brushcolor character varying(20) NOT NULL,
    brushwidth double precision NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    player_id integer
);
    DROP TABLE public.line;
       public         heap    postgres    false    2    2    2    2    2    2    2    2            �            1259    18584    line_line_id_seq    SEQUENCE     �   CREATE SEQUENCE public.line_line_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.line_line_id_seq;
       public          postgres    false    211            u           0    0    line_line_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.line_line_id_seq OWNED BY public.line.line_id;
          public          postgres    false    210            �            1259    18577    player    TABLE     �   CREATE TABLE public.player (
    player_id integer NOT NULL,
    name character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
    DROP TABLE public.player;
       public         heap    postgres    false            �            1259    18575    player_player_id_seq    SEQUENCE     �   CREATE SEQUENCE public.player_player_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.player_player_id_seq;
       public          postgres    false    209            v           0    0    player_player_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.player_player_id_seq OWNED BY public.player.player_id;
          public          postgres    false    208            �           2604    18589    line line_id    DEFAULT     l   ALTER TABLE ONLY public.line ALTER COLUMN line_id SET DEFAULT nextval('public.line_line_id_seq'::regclass);
 ;   ALTER TABLE public.line ALTER COLUMN line_id DROP DEFAULT;
       public          postgres    false    211    210    211            �           2604    18580    player player_id    DEFAULT     t   ALTER TABLE ONLY public.player ALTER COLUMN player_id SET DEFAULT nextval('public.player_player_id_seq'::regclass);
 ?   ALTER TABLE public.player ALTER COLUMN player_id DROP DEFAULT;
       public          postgres    false    208    209    209            m          0    18586    line 
   TABLE DATA           f   COPY public.line (line_id, geom, duration, brushcolor, brushwidth, created_at, player_id) FROM stdin;
    public          postgres    false    211   �$       k          0    18577    player 
   TABLE DATA           =   COPY public.player (player_id, name, created_at) FROM stdin;
    public          postgres    false    209   �$       �          0    17853    spatial_ref_sys 
   TABLE DATA           X   COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
    public          postgres    false    204   �$       w           0    0    line_line_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.line_line_id_seq', 1, false);
          public          postgres    false    210            x           0    0    player_player_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.player_player_id_seq', 1, false);
          public          postgres    false    208            �           2606    18596    line line_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.line
    ADD CONSTRAINT line_pkey PRIMARY KEY (line_id);
 8   ALTER TABLE ONLY public.line DROP CONSTRAINT line_pkey;
       public            postgres    false    211            �           2606    18583    player player_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.player
    ADD CONSTRAINT player_pkey PRIMARY KEY (player_id);
 <   ALTER TABLE ONLY public.player DROP CONSTRAINT player_pkey;
       public            postgres    false    209            �           1259    18602    lines_geom_idx    INDEX     >   CREATE INDEX lines_geom_idx ON public.line USING gist (geom);
 "   DROP INDEX public.lines_geom_idx;
       public            postgres    false    211    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2    2            �           2606    18597    line fk_line_player    FK CONSTRAINT     |   ALTER TABLE ONLY public.line
    ADD CONSTRAINT fk_line_player FOREIGN KEY (player_id) REFERENCES public.player(player_id);
 =   ALTER TABLE ONLY public.line DROP CONSTRAINT fk_line_player;
       public          postgres    false    211    209    3554            m      x������ � �      k      x������ � �      �      x������ � �     