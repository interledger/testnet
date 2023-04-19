CREATE USER rafiki_auth WITH PASSWORD 'rafiki_auth';
CREATE DATABASE rafiki_auth;
ALTER DATABASE rafiki_auth OWNER TO rafiki_auth;

CREATE USER rafiki_backend WITH PASSWORD 'rafiki_backend';
CREATE DATABASE rafiki_backend;
ALTER DATABASE rafiki_backend OWNER TO rafiki_backend;

CREATE USER wallet_backend WITH PASSWORD 'wallet_backend';
CREATE DATABASE wallet_backend;
ALTER DATABASE wallet_backend OWNER TO wallet_backend;
