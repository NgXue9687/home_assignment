-- Create database account roles with DBA & Dev role
CREATE ROLE "db_admin" WITH LOGIN NOSUPERUSER INHERIT NOREPLICATION PASSWORD 'htxl@gin!';
GRANT hrms_dba to "db_admin";
GRANT hrms_dev to "db_admin";


CREATE ROLE "db_dev" WITH LOGIN NOSUPERUSER INHERIT NOREPLICATION PASSWORD 'htxDEVl@gin!';
GRANT hrms_dba to "db_dev";
GRANT hrms_dev to "db_dev";


