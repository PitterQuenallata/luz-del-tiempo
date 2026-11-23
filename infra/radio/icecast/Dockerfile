FROM alpine:3.22

RUN apk add --no-cache icecast gettext \
  && mkdir -p /var/log/icecast \
  && chown -R icecast:icecast /var/log/icecast

COPY icecast.xml.tpl /etc/icecast/icecast.xml.tpl
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER icecast
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
