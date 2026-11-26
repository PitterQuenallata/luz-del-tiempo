-- «Secuencial» como modo de la lista se quita: el orden de los audios ahora está en order_pistas.
-- Las listas que tenían ese modo pasan a Mezclada (rotación); su orden de audios ya quedó en order_pistas (0021).
UPDATE "station_playlists" SET "mode" = 'rotacion' WHERE "mode" = 'secuencial';
