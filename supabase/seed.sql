insert into public.products (id, name, description, price, category, image, featured)
values
  (1, 'Paleta Sunset Glow', 'Sombras cálidas con brillo satinado y acabado profesional.', 28900, 'Ojos', '', true),
  (2, 'Base Silk Finish', 'Cobertura ligera a media, ideal para un rostro uniforme.', 34200, 'Rostro', '', true),
  (3, 'Gloss Berry Kiss', 'Gloss hidratante con tono berry y brillo espejo.', 15800, 'Labios', '', false),
  (4, 'Bolso Aura Mini', 'Bolso compacto con acabado suave y diseño elegante.', 49900, 'Bolsos', '', false),
  (5, 'Collar Rose Line', 'Cadena delicada con brillo sutil para looks diarios o noche.', 21200, 'Collares', '', false),
  (6, 'Set Pink Detail', 'Mini accesorios para complementar maquillaje y outfit.', 11900, 'Accesorios', '', false)
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.products', 'id'), coalesce((select max(id) from public.products), 1));