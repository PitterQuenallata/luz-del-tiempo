# Radio: Liquidsoap + Icecast + supervisord en una imagen Debian (como AzuraCast).
# Por cada emisora encendida, supervisord corre un grupo con su Icecast y su Liquidsoap.
# sincronizar.sh genera esos grupos desde data/config/emisoras.txt. La carpeta liquidsoap/ se monta en /radio.
FROM savonet/liquidsoap:v2.4.6

USER root
RUN mkdir -p /var/lib/apt/lists/partial /var/cache/apt/archives/partial \
  && apt-get update \
  && apt-get install -y --no-install-recommends icecast2 gettext-base supervisor \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/log/icecast /var/log/radio /procesos /control /tmp/radio-conf /tmp/radio-run \
  && chown -R liquidsoap:liquidsoap /var/log/icecast /var/log/radio /procesos /control /tmp/radio-conf /tmp/radio-run

USER liquidsoap
ENTRYPOINT ["/usr/bin/supervisord", "-c", "/radio/supervisord.conf"]
