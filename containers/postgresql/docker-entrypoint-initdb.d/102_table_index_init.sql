\c htxhrms;

SET ROLE hrms_dba;

SET SCHEMA 'hrms';

ALTER TABLE tasks
  ADD FOREIGN KEY (parenttaskid) REFERENCES tasks(taskid) ON DELETE CASCADE,
  ADD CONSTRAINT tasks_no_self_parent CHECK (parenttaskid IS NULL OR parenttaskid <> taskid);
CREATE INDEX ON tasks (parenttaskid);

ALTER TABLE developerskillsmapper
    ADD FOREIGN KEY (developerid) REFERENCES developers(developerid) ON DELETE CASCADE,
    ADD FOREIGN KEY (skillid) REFERENCES skills(skillid),
    ADD UNIQUE (developerid, skillid);


ALTER TABLE taskskillsmapper
  ADD FOREIGN KEY (taskid) REFERENCES tasks(taskid) ON DELETE CASCADE,
  ADD FOREIGN KEY (skillid) REFERENCES skills(skillid),
  ADD UNIQUE (taskid, skillid);

ALTER TABLE tasksmapper
  ADD FOREIGN KEY (taskid) REFERENCES tasks(taskid) ON DELETE CASCADE,
  ADD FOREIGN KEY (developerid) REFERENCES developers(developerid) ON DELETE CASCADE,
  ADD UNIQUE (taskid);

CREATE UNIQUE INDEX skills_name_uq ON skills (lower(skillname));
CREATE INDEX ON tasksmapper (developerid);
CREATE INDEX ON developerskillsmapper (skillid);
CREATE INDEX ON taskskillsmapper (skillid);