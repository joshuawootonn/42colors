non root user
https://www.digitalocean.com/community/tutorials/initial-server-setup-with-centos-8

install postgres
https://computingforgeeks.com/how-to-install-postgresql-12-on-centos-7/

allow remote connection
https://blog.bigbinary.com/2016/01/23/configure-postgresql-to-allow-remote-connection.html

my recommendation is to install postgres as the user, and then open up settings as root
it's amazing otherwise


psql -c "alter user postgres with password '****'" ALTER ROLE