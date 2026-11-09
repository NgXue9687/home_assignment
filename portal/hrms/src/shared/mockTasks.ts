import type { Task } from "./constants";

// Sample tasks for building the UI before the API is connected.
// Matches GET /tasks: developers and skills are the ones seeded in the database
// (Alice: Frontend, Bob: Backend, Carol: both, Dave: Backend), every assigned
// developer has the task's skills, and some tasks are subtasks (parentUuid set).
export const MOCK_TASKS: Task[] = [
  {
    "uuid": "c9ef37fc-828f-4e0b-8ae8-546a569aaab1",
    "taskTitle": "As a visitor, I want to see a responsive homepage so that I can easily navigate on both desktop and mobile devices.",
    "taskDescription": null,
    "status": "P",
    "version": 1,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "f3cc61e0-ac7a-4664-8635-e02c28f423eb",
      "name": "Alice"
    }
  },
  {
    "uuid": "5c9734d7-a123-4401-9e7f-7d0375c77846",
    "taskTitle": "As a system administrator, I want audit logs of all data access and modifications so that I can ensure compliance and investigate security incidents.",
    "taskDescription": "Details for: As a system administrator, I want audit logs of all data access and modifications.",
    "status": "T",
    "version": 3,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "10d1fdb0-2e56-45e8-a0f6-675e5dfc38e7",
      "name": "Dave"
    }
  },
  {
    "uuid": "500dd6ba-95d5-4aef-8100-44c7874615d2",
    "taskTitle": "As a logged-in user, I want to update my profile information and upload a profile picture so that my account details are accurate.",
    "taskDescription": null,
    "status": "P",
    "version": 4,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      },
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "7df5a971-151e-4494-8b54-629b84cf8ee6",
    "taskTitle": "Build task listing page with sortable columns",
    "taskDescription": "Details for: Build task listing page with sortable columns.",
    "status": "T",
    "version": 4,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": null
  },
  {
    "uuid": "8d912c09-e19a-422f-a461-e97661935334",
    "taskTitle": "Create REST endpoint to assign a developer to a task",
    "taskDescription": "Details for: Create REST endpoint to assign a developer to a task.",
    "status": "T",
    "version": 3,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "91818e1f-3505-4640-8c26-2a075905cefd",
    "taskTitle": "Add pagination to GET /tasks",
    "taskDescription": "Details for: Add pagination to GET /tasks.",
    "status": "D",
    "version": 2,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "7c3a652a-b1e4-44fb-a6fd-948d58bba895",
      "name": "Bob"
    }
  },
  {
    "uuid": "89e6b961-5451-43f0-93f0-443ff2e0ef88",
    "taskTitle": "Implement dark mode toggle in the header",
    "taskDescription": "Details for: Implement dark mode toggle in the header.",
    "status": "T",
    "version": 1,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": null
  },
  {
    "uuid": "3226b5a1-4d8c-4792-8d29-c0fdb46e2aa2",
    "taskTitle": "Integrate LLM to identify required skills for new tasks",
    "taskDescription": null,
    "status": "T",
    "version": 1,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "7c3a652a-b1e4-44fb-a6fd-948d58bba895",
      "name": "Bob"
    }
  },
  {
    "uuid": "ef4d1de0-c532-4670-9517-712a5c6feca0",
    "taskTitle": "As a manager, I want to filter tasks by status so that I can track progress at a glance.",
    "taskDescription": "Details for: As a manager, I want to filter tasks by status.",
    "status": "P",
    "version": 2,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      },
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "701989d4-92cd-4619-be56-c07be469a7ac",
    "taskTitle": "Migrate frontend from Next.js to Vite with React Router",
    "taskDescription": null,
    "status": "P",
    "version": 3,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "7e70eba6-552a-4d47-8f1a-805c91e37cd0",
    "taskTitle": "Set up PostgreSQL indexes for task queries",
    "taskDescription": "Details for: Set up PostgreSQL indexes for task queries.",
    "status": "T",
    "version": 2,
    "parentUuid": null,
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "7c3a652a-b1e4-44fb-a6fd-948d58bba895",
      "name": "Bob"
    }
  },
  {
    "uuid": "0de121a3-8abd-4e71-aa30-6c529caaec06",
    "taskTitle": "Write onboarding guide for new developers",
    "taskDescription": "Details for: Write onboarding guide for new developers.",
    "status": "D",
    "version": 1,
    "parentUuid": null,
    "skills": [],
    "assignedDeveloper": null
  },
  {
    "uuid": "85c44260-9b87-43f3-8377-6f88b63cbc21",
    "taskTitle": "Design profile page form layout",
    "taskDescription": "Details for: Design profile page form layout.",
    "status": "D",
    "version": 3,
    "parentUuid": "500dd6ba-95d5-4aef-8100-44c7874615d2",
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "c2a06751-a6e2-492d-b020-c0126b442086",
    "taskTitle": "Add image upload endpoint with size validation",
    "taskDescription": null,
    "status": "P",
    "version": 1,
    "parentUuid": "500dd6ba-95d5-4aef-8100-44c7874615d2",
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "10d1fdb0-2e56-45e8-a0f6-675e5dfc38e7",
      "name": "Dave"
    }
  },
  {
    "uuid": "cae40c8b-fe25-4b8b-a5b6-b8d1d8186bc5",
    "taskTitle": "Store uploaded pictures in object storage",
    "taskDescription": "Details for: Store uploaded pictures in object storage.",
    "status": "T",
    "version": 3,
    "parentUuid": "c2a06751-a6e2-492d-b020-c0126b442086",
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": null
  },
  {
    "uuid": "85b1d7d2-ded4-48ed-a359-2978c2388ac4",
    "taskTitle": "Add status filter dropdown",
    "taskDescription": null,
    "status": "T",
    "version": 2,
    "parentUuid": "ef4d1de0-c532-4670-9517-712a5c6feca0",
    "skills": [
      {
        "uuid": "9b58e9a0-ab47-4b99-a8b5-8dcf8187afc1",
        "skillName": "Frontend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  },
  {
    "uuid": "8c8f3b8d-5bc3-4373-917f-96cd9df3cca4",
    "taskTitle": "Support status query parameter in GET /tasks",
    "taskDescription": "Details for: Support status query parameter in GET /tasks.",
    "status": "T",
    "version": 1,
    "parentUuid": "ef4d1de0-c532-4670-9517-712a5c6feca0",
    "skills": [
      {
        "uuid": "bdfb63cb-38c7-4c59-b177-efbeda7dcaa1",
        "skillName": "Backend"
      }
    ],
    "assignedDeveloper": {
      "uuid": "508645b0-0f31-461a-95c9-7960d9420435",
      "name": "Carol"
    }
  }
];
