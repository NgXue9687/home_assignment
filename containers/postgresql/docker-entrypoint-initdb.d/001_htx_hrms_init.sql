-- Create Application Roles
CREATE ROLE hrms_webapp WITH LOGIN NOSUPERUSER NOINHERIT PASSWORD 'HRms_login';


-- Create Database Roles
CREATE ROLE hrms_dba WITH NOSUPERUSER NOINHERIT NOREPLICATION CREATEDB CREATEROLE;
CREATE ROLE hrms_dev WITH NOSUPERUSER NOINHERIT NOREPLICATION;


-- Grant TO master_user so it can create DB as the owner
GRANT hrms_dba TO admin_user;

-- Grant TO hrms_dba so DBA have access to the role
GRANT hrms_webapp TO hrms_dba;

-- Create Database for hrms
CREATE DATABASE htxhrms WITH OWNER hrms_dba ENCODING 'UTF8';
COMMENT ON DATABASE htxhrms IS 'Main Database for HTX HRMS';
REVOKE ALL PRIVILEGES ON DATABASE htxhrms FROM PUBLIC;
