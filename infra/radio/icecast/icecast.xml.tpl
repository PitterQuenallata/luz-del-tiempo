<icecast>
  <location>Bolivia</location>
  <admin>admin@laluzdeltiempo.org</admin>
  <hostname>${ICECAST_HOSTNAME}</hostname>

  <limits>
    <clients>${ICECAST_MAX_CLIENTS}</clients>
    <sources>20</sources>
    <queue-size>524288</queue-size>
    <client-timeout>30</client-timeout>
    <header-timeout>15</header-timeout>
    <source-timeout>10</source-timeout>
    <burst-size>65535</burst-size>
  </limits>

  <!-- Solo Liquidsoap publica en Icecast; los locutores entran por Liquidsoap (harbor). -->
  <authentication>
    <source-password>${ICECAST_SOURCE_PASSWORD}</source-password>
    <admin-user>admin</admin-user>
    <admin-password>${ICECAST_ADMIN_PASSWORD}</admin-password>
  </authentication>

  <listen-socket>
    <port>8000</port>
  </listen-socket>

  <http-headers>
    <header name="Access-Control-Allow-Origin" value="*" />
  </http-headers>

  <fileserve>1</fileserve>

  <paths>
    <basedir>/usr/share/icecast</basedir>
    <logdir>/var/log/icecast</logdir>
    <webroot>/usr/share/icecast/web</webroot>
    <adminroot>/usr/share/icecast/admin</adminroot>
    <alias source="/" destination="/status.xsl" />
  </paths>

  <logging>
    <accesslog>access.log</accesslog>
    <errorlog>error.log</errorlog>
    <loglevel>3</loglevel>
    <logsize>10000</logsize>
  </logging>

  <security>
    <chroot>0</chroot>
  </security>
</icecast>
