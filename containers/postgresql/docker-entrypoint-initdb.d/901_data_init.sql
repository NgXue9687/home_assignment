\c htxhrms;

SET ROLE db_admin;

INSERT INTO hrms.skills(uuid,createdby,modifiedby,skillname,skilldescription,status)
VALUES
    (gen_random_uuid(),'System','System','Frontend','Builds and maintains the user interface of web applications, turning designs into responsive, accessible screens and integrating them with backend APIs.','A'),
    (gen_random_uuid(),'System','System','Backend','Develops server-side logic, APIs and databases, ensuring data integrity, security and performance of the application.','A')
;


INSERT INTO hrms.developers(uuid,createdby,modifiedby,name,email,division,designation,status)
VALUES
    (gen_random_uuid(),'System','System','Alice','alice_koh@hotmail.com','Engineering','Engineer','A'),
    (gen_random_uuid(),'System','System','Bob','bob_lee@hotmail.com','DevSecOps','Lead Engineer','A'),
    (gen_random_uuid(),'System','System','Carol','carol_wee@hotmail.com','Engineering','Lead Engineer','A'),
    (gen_random_uuid(),'System','System','Dave', 'dave_wong@hotmail.com','Operations','Engineer','A')
;

INSERT INTO hrms.developerskillsmapper(createdby,modifiedby,developerid,skillid)
SELECT 'System','System',developer.developerid,skill.skillid
FROM (VALUES ('Alice','Frontend'),('Bob','Backend'),('Carol','Frontend'),('Carol','Backend'),('Dave','Backend')) v(dev,skill)
JOIN hrms.developers developer on developer.name = v.dev
JOIN hrms.skills skill on skill.skillname = v.skill;

INSERT INTO hrms.sysconfig (createdby,modifiedby,sysconfigname,sysconfigvalue)
VALUES ('System','System','MAX_SUBTASK_LIST_SIZE','3');


