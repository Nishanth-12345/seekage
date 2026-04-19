This is a massive and exciting concept, Vivek. Building an EdTech platform like SEEKAGE with the complexity of BYJU's is a fantastic programming challenge. The features you’ve outlined—dual registration paths, parental controls, role-based dashboards (Admin, School, Student, Counselor), and bilingual support in English and Malayalam—are highly comprehensive.

Before we write code, we need a reality check on the architecture. You cannot connect React Native directly to an SQL database. Doing so is a major security risk. You need a "middleman" (a backend server) to handle the logic, security, and video streaming.

Here is the standard architecture you will need:

Frontend (Mobile App): React Native.

Backend (API): Node.js with Express (to handle logins, chat routing, and database queries).

Database: MySQL (viewed via SQL Workbench) to store user data, text, and relationships.

Storage: Cloud storage (like AWS S3 or Cloudinary) for videos and documents. Never store video files directly in a SQL database; store the video URL instead.

Here is a blueprint to get SEEKAGE started, breaking down your requirements into actionable steps.

Phase 1: The MySQL Database Schema
We need to structure your SQL Workbench to handle the complex relationships between admins, students, schools, and parents.

SQL
-- Core Users Table (Handles Admins, Students, Parents, Counselors)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'student', 'parent', 'teacher', 'counselor', 'psychologist') NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    parent_password VARCHAR(255), -- Editable only by admin
    age INT,
    state VARCHAR(50),
    preferred_language ENUM('en', 'ml') DEFAULT 'en' -- English or Malayalam
);

-- Schools Table
CREATE TABLE Schools (
    school_id INT AUTO_INCREMENT PRIMARY KEY,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    place VARCHAR(100) NOT NULL
);

-- Groups (Handles both Age-based batches and School-based classes)
CREATE TABLE Study_Groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_type ENUM('age_based', 'school_based') NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    school_id INT DEFAULT NULL, -- Null if age-based
    student_count INT DEFAULT 0, -- Max 100 logic handled in backend
    FOREIGN KEY (school_id) REFERENCES Schools(school_id)
);

-- Content (Videos, Docs, Notes)
CREATE TABLE Content (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    uploader_id INT, -- Admin or Teacher
    content_type ENUM('video', 'document', 'note', 'assignment') NOT NULL,
    subject_name VARCHAR(50),
    file_url VARCHAR(255) NOT NULL, -- Link to AWS S3/Cloud storage
    is_hidden_by_parent BOOLEAN DEFAULT FALSE, -- The '0' symbol logic
    FOREIGN KEY (group_id) REFERENCES Study_Groups(group_id),
    FOREIGN KEY (uploader_id) REFERENCES Users(user_id)
);
Phase 2: React Native Navigation Skeleton
To handle your dual login and dashboard requirement (Age-based vs. School-based), you will need a robust navigation structure using React Navigation.

Here is how the core structure looks:

JavaScript
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// Placeholder Components
const LoginScreen = () => {/* Form with Age or School Code */};
const SeekageDashboard = () => {/* Admin controlled, age-based batches */};
const SchoolDashboard = () => {/* Teacher controlled, subject folders */};
const VideoPlayerScreen = () => {/* Video view with parent hide toggle */};
const CounselingScreen = () => {/* Chat interface for psychologist */};

export default function App() {
  const [isMalayalam, setIsMalayalam] = useState(false); // The '0' language toggle state

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Authentication */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Main Dashboards based on registration type */}
        <Stack.Screen 
          name="SeekageHome" 
          component={SeekageDashboard} 
          options={{ title: isMalayalam ? 'സീക്കേജ്' : 'Seekage' }} 
        />
        <Stack.Screen 
          name="SchoolHome" 
          component={SchoolDashboard} 
          options={{ title: isMalayalam ? 'സ്കൂൾ' : 'School' }} 
        />

        {/* Features */}
        <Stack.Screen name="ContentView" component={VideoPlayerScreen} />
        <Stack.Screen name="HelpAndCounseling" component={CounselingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
Phase 3: Handling Your Specific Features
The '0' Language Toggle: To translate the app between English and Malayalam, you shouldn't hardcode translations. Use a library called react-i18next. You create a JSON file for English words and a JSON file for Malayalam words, and the '0' button just toggles which file the app reads from. It's a great feature for regional accessibility.

The '0' Hide/Unhide by Parents: When a parent clicks '0' on a video folder, the React Native app sends a request to your Node.js server. The server updates the is_hidden_by_parent column in the Content SQL table to TRUE. When the student's app loads, it filters out any content where that value is true.

100 Students Per Group Limit: When a student registers, your Node.js backend checks the student_count for the relevant Study_Group. If it is at 100, the server automatically executes a SQL command to create a new group (e.g., "Age 10-11 Batch B") and assigns the student there.

Chat and Calling: For text chat, you will need to implement Socket.io in your Node.js backend for real-time messaging. For calling (after permission), you can use the react-native-communications library to trigger the phone's native dialer, or integrate a service like Twilio or Agora for in-app VoIP calling.


i want a app in react native and store in sql workbench ,the project like BYJU's app,admin user want to upload video and documents for students,students get videos and documents and they can chat with user and give complaints for docs and videos and they want help section and user need counsiling and phycholigist section to students to user admin user connect the counselingg to counseler and phycholgist section connect to user to phycholigist and ,students can give text and after permision they can call,they videos and docs can hide from students that hided by parents that they can open and show to students and the parents can hide using password and password given by user,only admin user can edit password,admin user can delete the upload videos and docx and comments,the project name is SEEKAGE,the front login page have 2 types,mainly age based login and registration,example is 10 to 11 age is registred to one group ,in the group contain admoin user can control sepperate and upload videso for these batch,another login is school stand wise ,example which school which class,that gointo another group ,maximum 100 in one group afte that can create new group to students to connect,login have students name,age,mob number,password,state,password confirmed by number,terms condition,terms and condition age wise or schoolwise,age wise need parents or students need to enter student name and age one group that can edit,give noted and voice and videos and qustion ans answer and assignment,second terns that school wise registration thats need enter school code and school details like name ,place, in these have name is seekage for that page ,in seekage can enter school code and details to open a folder have subject 1 , subject2,subject3 etc that can create by user,subjects inside notes and videos and assignment ,and qustion answer,comments they can chat,and edit option and hide and unhide that can acces only admin to parent first page in seekage have seekage head and inseekage page contain seekage and school are 2 headlines school can access and activated by school authority , and thats cab access and upload videos and another activity controlled by school teachers or another they can give all features inside the page ,seejage clicks open same like video and notes ,qstion pages etc that can access user admin,their own data can uploded by user admin in head line like seekage or school have a symbol like '0' to select language is malayalm or english when englisg select thsat can translate to english or malayalm that can translate malayalam .video and edit and question and answer folder have symbol "0" to hide and unhide by paents.


eagleai

 EagleAIBackend — Project Overview

  EagleAIBackend (package name: oceanai-agents) is a multi-agent AI orchestration platform built with FastAPI and Python
   3.12+. It enables organizations to build, deploy, and manage AI agents at scale.

  Core Capabilities

  - Agent Management — Create, configure, cache, and execute AI agents with version-aware caching (LRU + TTL)
  - 20+ Tools — SQL queries, vector DB search, MongoDB, email (draft/send/search), Jira/Zoho tickets, web crawling,
  dashboards, nested agents, and more
  - Knowledge Bases — Manage vector DBs, relational DBs, and MongoDB as searchable knowledge sources with file ingestion
  - Triggers & Scheduling — Cron-based, email polling, Teams meeting/chat monitoring via APScheduler
  - Real-Time Voice Agents — WebSocket-based conversational agents with audio support
  - Workflows — Composable multi-agent workflows with task execution and result aggregation
  - RBAC & Authorization — OpenFGA-based fine-grained access control with User → Team → Org hierarchy

  Tech Stack

  ┌──────────────┬────────────────────────────────────────────────────────────────────┐
  │    Layer     │                            Technologies                            │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ API          │ FastAPI, Uvicorn, 30+ routers                                      │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ AI/LLM       │ LangChain, Azure OpenAI, OpenAI Agents SDK                         │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ Database     │ SQLAlchemy 2.x (SQLite, PostgreSQL, Azure SQL), Alembic migrations │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ Knowledge    │ MongoDB, Cosmos DB (vector search), Azure OpenAI embeddings        │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ Auth         │ Azure AD, MSAL, OpenFGA, JWT                                       │
  ├──────────────┼────────────────────────────────────────────────────────────────────┤
  │ Integrations │ Microsoft Teams, Outlook/Exchange, Jira, Zoho, Crawl4AI            │
  └──────────────┴────────────────────────────────────────────────────────────────────┘

  Architecture

  The codebase (~231 core Python files) follows an agent-centric, async-first design with clear separation:

  - api/ — Routers, controllers, schemas, middleware
  - ai/ — Agent manager, tools, connectors, triggers, embeddings, prompts
  - models/ — 30+ SQLAlchemy entities (agents, tools, triggers, chat history, workflows, users, etc.)

  Key Patterns

  - Tool Factory for consistent tool assembly with retry wrapping
  - Connection Pooling with managed connectors and TTL
  - Multi-Tenancy with OpenFGA enforcement
  - Event-Driven Triggers from multiple sources (scheduled, email, Teams) with a unified runner
  - Graceful Degradation when external services are unavailable

  In short, it's a production-grade, multi-tenant AI orchestration backend designed for enterprise SaaS deployments with
   deep Microsoft ecosystem integration.





 agent orchestration platform UI.

  Core features / modules:
  - Main Dashboard & Monitoring — overview + MonitoringDashboard for agent/run health.
  - Agents — AgentsList, AgentEditor, AgentRunner, AgentGroups to author and execute agents.
  - Agent configuration catalogs — AgentTypeConfig, PromptConfig, ToolTypeConfig, OutputParserConfig,
  ConnectorTypeConfig for reusable building blocks.
  - Knowledge Base — upload/manage documents (docx/xlsx/markdown preview) for RAG.
  - Triggers — AgentTriggerConfig + TriggerRunsDashboard for scheduled/event-driven runs.
  - Workflow builder — visual workflow composer with streaming progress (react-xarrows, WorkflowStreamingProgress).
  - Specialized agents — VoiceAgent (real-time audio), QAAgent, SupportBot, Meetings.
  - Administration — Users, Organization, Access Assignments, Templates, Entity Assignment, Reports.
  - Auth — Azure MSAL + OIDC Identity Server callback, protected routes.

  Tech stack:
  - Framework: React 19 + Vite 6, React Router 7, lazy-loaded routes.
  - State: Redux Toolkit + React-Redux.
  - UI: Tailwind CSS 4, Radix UI primitives, shadcn-style components, Framer Motion, lucide-react, Sonner toasts.
  - Forms/validation: react-hook-form + Zod.
  - Data viz: Highcharts, Recharts, TanStack Table.
  - Docs/files: mammoth, docx-preview, xlsx, react-markdown + remark-gfm, DOMPurify.
  - Auth: @azure/msal-browser/react, oidc-client-ts.
  - Real-time: streaming workflow progress, voice/audio context provider.

  Approach: Modular page/feature layout (pages/, components/, services/api.js, store/slices, contexts/), code-splitting
  via React.lazy, central API service, Redux slices per domain — built as the config + runtime console for a backend
  agent platform.

✻ Cooked for 33s


● EagleAI Frontend

  - Built an enterprise AI Agent Orchestration Dashboard (OceanAI Agents) in React 19 + Vite 6, enabling users to
  create, configure, run, and monitor AI agents end-to-end.
  - Designed 30+ modular pages across Agents, Workflows, Knowledge Base, Triggers, Prompts, Tools, Connectors, Output
  Parsers, and Administration modules.
  - Implemented a visual workflow builder with real-time streaming progress using react-xarrows and custom streaming
  components.
  - Developed specialized agent interfaces: Voice Agent (real-time audio via Web Audio context), QA Agent, Support Bot,
  and Meetings module.
  - Integrated Knowledge Base / RAG document management with in-browser preview for DOCX, XLSX, and Markdown (mammoth,
  docx-preview, xlsx, react-markdown).
  - Built Trigger scheduling and a Trigger Runs Dashboard for event-driven and scheduled agent executions.
  - Created a full Admin suite: Users, Organization, Access Assignments, Templates, Entity Assignments, and Reports with
   role-based access.
  - Implemented secure authentication using Azure MSAL and OIDC Identity Server with protected routes and callback
  handling.
  - Managed global state with Redux Toolkit (feature-based slices) and React Context for Auth and Audio providers.
  - Designed a responsive, accessible UI with Tailwind CSS 4, Radix UI primitives, shadcn/ui, Framer Motion, and Lucide
  icons.
  - Built robust forms using React Hook Form + Zod schema validation.
  - Integrated rich data visualization with Highcharts, Recharts, and advanced tables via TanStack Table.
  - Optimized performance through React.lazy / Suspense route-level code splitting and skeleton loaders.
  - Centralized API communication via a unified services/api.js layer and implemented a real-time streaming layer for
  workflow execution.
  - Hardened against XSS using DOMPurify for rendered markdown/HTML content.
  - Delivered a monitoring dashboard for live observability of agent runs, tool invocations, and workflow status.
  - Tech Stack: React 19, Redux Toolkit, React Router 7, Tailwind 4, Radix UI, MSAL, OIDC, Highcharts, Recharts, React
  Hook Form, Zod, Vite, ESLint.


 Good — here's the verified sanity check:

  RBAC — Confirmed

  - apiRBAC.assignRole() exists in src/services/api.js
  - OpenFGA is used as the authorization backend (AccessAssignments.jsx:306 — "synced ... role assignments to OpenFGA")
  - Roles are assigned per user + target_type + target_id (entity-scoped RBAC, not just global roles)
  - Full admin UI: Users.jsx, AccessAssignments.jsx, EntityAssignment.jsx, UserAccessDrawer.jsx, BulkAssignDrawer.jsx,
  RoleBadge component

  Safe resume phrasing: "Implemented entity-scoped RBAC UI integrated with an OpenFGA authorization backend, including
  role assignment, bulk assignment, and user access management drawers."

  Streaming — Confirmed

  - Protocol: Server-Sent Events (SSE) over fetch with ReadableStream + getReader() (not the EventSource API)
  - Accept: text/event-stream header, parses frames by double-newline, handles keepalive comments (: ...)
  - Two streaming pipelines: agent run (api.js:294) and orchestrate-run-and-synthesize (api.js:604)
  - Callback pattern: onStreamEvent({ event, data })
 "Built a custom SSE streaming client using fetch + ReadableStream to consume real-time agent run
   events, including frame parsing, keepalive handling, and event-callback dispatch for live workflow progress."

  Both claims are now backed by concrete code — safe for interviews.