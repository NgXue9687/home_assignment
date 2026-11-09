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

-- Sample tasks (from the wireframe). Every task is a top-level task, so parenttaskid stays empty.
-- The skills of each task are listed once, next to its title, so no taskid is hard-coded.
WITH seed (title, skillnames) AS (
  VALUES
    ('As a visitor, I want to see a responsive homepage so that I can easily navigate on both desktop and mobile devices',
      ARRAY['Frontend']),
    ('As a system administrator, I want to audit logs of all data access and modifications so that I can ensure compliance with data protection and investigate security incidents',
      ARRAY['Backend']),
    ('As an officer, I want to upload my profile information and upload a profile picture so that my account details are accurate and personalised',
      ARRAY['Frontend', 'Backend'])
),
new_tasks AS (
  INSERT INTO hrms.tasks (uuid, createdby, modifiedby, tasktitle)
  SELECT gen_random_uuid(), 'System', 'System', title FROM seed
  RETURNING taskid, tasktitle
)
INSERT INTO hrms.taskskillsmapper (createdby, modifiedby, taskid, skillid)
SELECT 'System', 'System', new_tasks.taskid, skill.skillid
FROM new_tasks
JOIN seed ON seed.title = new_tasks.tasktitle
JOIN hrms.skills skill ON skill.skillname = ANY (seed.skillnames);

-- The wireframe shows the first task already assigned to Alice, who has the Frontend skill.
INSERT INTO hrms.tasksmapper (createdby, modifiedby, taskid, developerid)
SELECT 'System', 'System', task.taskid, developer.developerid
FROM hrms.tasks task
JOIN hrms.developers developer ON developer.name = 'Alice'
WHERE task.tasktitle LIKE 'As a visitor%';
