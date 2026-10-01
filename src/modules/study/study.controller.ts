import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';
import { STUDY_COURSES } from './study.data.js';
import { MONTH_1_CODING_TASKS } from './studyTasks.data.js';

export const getCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Get user progress records
    const userProgress = userId
      ? await db.userStudyProgress.findMany({
          where: { userId, completed: true },
        })
      : [];

    const completedLessonIds = new Set(userProgress.map((p) => p.lessonId));

    const courses = STUDY_COURSES.map((course) => {
      let totalLessons = 0;
      let completedCount = 0;
      let lastCompletedLesson: string | null = null;
      let currentLessonTitle: string | null = null;

      course.modules.forEach((mod) => {
        totalLessons += mod.lessons.length;
        mod.lessons.forEach((lesson) => {
          if (completedLessonIds.has(lesson.id)) {
            completedCount++;
            lastCompletedLesson = lesson.id;
          } else if (!currentLessonTitle) {
            currentLessonTitle = lesson.title;
          }
        });
      });

      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        slug: course.slug,
        title: course.title,
        badge: course.badge,
        description: course.description,
        totalModules: course.modules.length,
        totalLessons,
        completedLessons: completedCount,
        progressPercent,
        currentLesson: currentLessonTitle || 'Course Completed 🎉',
      };
    });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const userId = req.user?.userId;

    const course = STUDY_COURSES.find((c) => c.slug === slug);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
      return;
    }

    const userProgress = userId
      ? await db.userStudyProgress.findMany({
          where: { userId, courseSlug: slug, completed: true },
        })
      : [];

    const completedLessonIds = new Set(userProgress.map((p) => p.lessonId));

    let totalLessons = 0;
    let completedCount = 0;

    const modulesWithProgress = course.modules.map((mod) => {
      const lessonsWithProgress = mod.lessons.map((lesson) => {
        totalLessons++;
        const isCompleted = completedLessonIds.has(lesson.id);
        if (isCompleted) completedCount++;

        return {
          ...lesson,
          isCompleted,
        };
      });

      return {
        ...mod,
        lessons: lessonsWithProgress,
      };
    });

    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...course,
        totalModules: course.modules.length,
        totalLessons,
        completedLessons: completedCount,
        progressPercent,
        modules: modulesWithProgress,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const toggleLessonProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { courseSlug, lessonId } = req.body;

    if (!userId || !courseSlug || !lessonId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: courseSlug and lessonId.',
      });
      return;
    }

    const existing = await db.userStudyProgress.findUnique({
      where: {
        userId_courseSlug_lessonId: {
          userId,
          courseSlug,
          lessonId,
        },
      },
    });

    let isCompleted = true;

    if (existing) {
      isCompleted = !existing.completed;
      await db.userStudyProgress.update({
        where: { id: existing.id },
        data: { completed: isCompleted },
      });
    } else {
      await db.userStudyProgress.create({
        data: {
          userId,
          courseSlug,
          lessonId,
          completed: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lessonId,
        isCompleted,
      },
      message: isCompleted ? 'Lesson marked as completed.' : 'Lesson marked as incomplete.',
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
// MONTHLY CODING TASKS CONTROLLER METHODS (40 Tasks / Month)
// -------------------------------------------------------------
export const getCodingTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const month = req.query.month ? Number(req.query.month) : 1;

    // Month 1 is JS & TS (40 Tasks)
    const baseTasks = month === 1 ? MONTH_1_CODING_TASKS : [];

    const submissions = userId
      ? await db.userCodingTaskSubmission.findMany({
          where: { userId, month },
        })
      : [];

    const submissionMap = new Map(submissions.map((s) => [s.taskId, s]));

    const tasksWithStatus = baseTasks.map((task) => {
      const sub = submissionMap.get(task.id);
      return {
        ...task,
        isCompleted: !!sub,
        submittedCode: sub?.code || null,
        submittedAt: sub?.submittedAt || null,
      };
    });

    const totalTasks = baseTasks.length;
    const completedTasks = submissions.length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        month,
        totalTasks,
        completedTasks,
        completionPercent,
        tasks: tasksWithStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const submitCodingTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { month = 1, taskId, code } = req.body;

    if (!userId || !taskId || !code) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: taskId and code.',
      });
      return;
    }

    const submission = await db.userCodingTaskSubmission.upsert({
      where: {
        userId_month_taskId: {
          userId,
          month: Number(month),
          taskId: String(taskId),
        },
      },
      update: {
        code,
        status: 'COMPLETED',
        submittedAt: new Date(),
      },
      create: {
        userId,
        month: Number(month),
        taskId: String(taskId),
        code,
        status: 'COMPLETED',
      },
    });

    res.status(200).json({
      success: true,
      data: submission,
      message: 'Study coding task submitted successfully!',
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminStudyOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Admin, Marketing Head, or Founder check
    const role = req.user?.role;
    if (role === 'EMPLOYEE') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin view only.',
      });
      return;
    }

    const employees = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        email: true,
        role: true,
        designation: true,
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const [allProgress, allSubmissions] = await Promise.all([
      db.userStudyProgress.findMany({ where: { completed: true } }),
      db.userCodingTaskSubmission.findMany({ where: { month: 1 } }),
    ]);

    const progressByEmployee = new Map<string, number>();
    allProgress.forEach((p) => {
      progressByEmployee.set(p.userId, (progressByEmployee.get(p.userId) || 0) + 1);
    });

    const codingTasksByEmployee = new Map<string, number>();
    allSubmissions.forEach((s) => {
      codingTasksByEmployee.set(s.userId, (codingTasksByEmployee.get(s.userId) || 0) + 1);
    });

    const totalStudyLessonsInCourse = 98; // 46 JS + 52 TS
    const totalCodingTasksInMonth = 40;

    const report = employees.map((emp) => {
      const lessonsDone = progressByEmployee.get(emp.id) || 0;
      const tasksDone = codingTasksByEmployee.get(emp.id) || 0;
      const taskProgressPercent = Math.round((tasksDone / totalCodingTasksInMonth) * 100);

      return {
        ...emp,
        lessonsCompleted: lessonsDone,
        totalLessons: totalStudyLessonsInCourse,
        codingTasksCompleted: tasksDone,
        totalCodingTasks: totalCodingTasksInMonth,
        taskProgressPercent,
        statusBadge:
          tasksDone >= 40
            ? 'COMPLETED'
            : tasksDone >= 20
            ? 'ON_TRACK'
            : tasksDone > 0
            ? 'IN_PROGRESS'
            : 'NOT_STARTED',
      };
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------------
// CO-INTERN STUDY TOPICS CONTROLLER METHODS (12 TOPICS)
// -------------------------------------------------------------
export const INITIAL_CO_INTERN_TOPICS = [
  {
    topicNumber: 1,
    title: 'Nice page for two days',
    duration: '2 days',
    week: 1,
    status: 'OPEN',
    content: `### Topic 1: Nice Page Implementation Guide
**Duration**: 2 Days | **Level**: Beginner

#### Overview
Nicepage is a drag-and-drop web design tool and HTML generator. In this topic, co-interns will learn layout structure, section design, responsive breakpoints, and exporting clean code.

#### Key Objectives
- Understand block-based web layout structure
- Design mobile-responsive header and hero sections
- Export clean HTML/CSS code for BluNet integration

#### Hands-On Exercise
1. Build a 3-section landing page with Hero, Features, and Contact Footer.
2. Test responsive layout on Desktop, Tablet, and Mobile viewports.
3. Export HTML/CSS and inspect element styling.`,
  },
  {
    topicNumber: 2,
    title: 'Git for 4 days',
    duration: '4 days',
    week: 1,
    status: 'OPEN',
    content: `### Topic 2: Git Version Control Mastery
**Duration**: 4 Days | **Level**: Intermediate

#### Overview
Git is essential for team collaboration. This 4-day module covers core Git workflow, branching strategy, pull requests, resolving merge conflicts, and rebase best practices.

#### Day-by-Day Roadmap
- **Day 1**: Git Basics (\`init\`, \`add\`, \`commit\`, \`status\`, \`log\`)
- **Day 2**: Branching Strategy (\`git checkout -b\`, \`git merge\`, \`git branch -d\`)
- **Day 3**: GitHub/GitLab Collaboration (Remote repos, Pull Requests, Code Reviews)
- **Day 4**: Resolving Merge Conflicts & Interactive Rebase

\`\`\`bash
# Basic Git Command Flow
git checkout -b feature/co-intern-dashboard
git add .
git commit -m "feat: implement co-intern study resource tab"
git push origin feature/co-intern-dashboard
\`\`\``,
  },
  {
    topicNumber: 3,
    title: 'AWS for 4 days',
    duration: '4 days',
    week: 1,
    status: 'OPEN',
    content: `### Topic 3: Amazon Web Services (AWS) Cloud Fundamentals
**Duration**: 4 Days | **Level**: Intermediate

#### Overview
Introduction to cloud computing infrastructure using AWS services: IAM, EC2, S3, RDS, and CloudFront.

#### Key Services Covered
1. **IAM (Identity & Access Management)**: Roles, Policies, Least privilege access
2. **EC2 (Elastic Compute Cloud)**: Launching Linux instances, SSH security groups
3. **S3 (Simple Storage Service)**: Buckets, Static website hosting, Presigned URLs
4. **RDS & CloudFront**: Relational databases and CDN distribution setup

\`\`\`bash
# AWS CLI S3 Sync Command
aws s3 sync ./dist s3://blunet-intern-app-bucket --acl public-read
\`\`\``,
  },
  {
    topicNumber: 4,
    title: 'Docker for 5 days',
    duration: '5 days',
    week: 1,
    status: 'OPEN',
    content: `### Topic 4: Containerization with Docker & Docker Compose
**Duration**: 5 Days | **Level**: Intermediate to Advanced

#### Overview
Containerize Node.js/React web applications and manage multi-container environments.

#### Syllabus
- **Day 1**: Containers vs Virtual Machines & Installing Docker
- **Day 2**: Writing production-grade \`Dockerfile\` & \`.dockerignore\`
- **Day 3**: Multi-stage Docker builds for React and Node.js
- **Day 4**: \`docker-compose.yml\` networking and PostgreSQL integration
- **Day 5**: Container optimization, health checks, and Docker Volume persistence

\`\`\`dockerfile
# Production Node.js Dockerfile Example
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
\`\`\``,
  },
  {
    topicNumber: 5,
    title: 'jenkins for 4 days',
    duration: '4 days',
    week: 2,
    status: 'OPEN',
    content: `### Topic 5: Jenkins CI/CD Automation Pipeline
**Duration**: 4 Days | **Level**: Advanced

#### Overview
Automate building, testing, and deploying web applications using Jenkins automation server and declarative Jenkinsfiles.

#### Topics Covered
- Setting up Jenkins server with Docker
- Configuring GitHub Webhooks & Credentials
- Writing Declarative \`Jenkinsfile\` Pipelines (Build, Test, SonarQube, Deploy steps)
- Automated deployment to staging and production servers`,
  },
  {
    topicNumber: 6,
    title: 'versal for 2 days',
    duration: '2 days',
    week: 2,
    status: 'OPEN',
    content: `### Topic 6: Vercel Cloud Deployment & Edge Functions
**Duration**: 2 Days | **Level**: Beginner to Intermediate

#### Overview
Deploy frontend applications, Next.js / Vite React apps, custom domains, and environment variables on Vercel platform.

#### Key Tasks
1. Linking GitHub repository to Vercel account
2. Configuring Environment Variables for Staging and Production
3. Setting up automatic preview deployments on Pull Requests
4. Optimizing build caching and headers`,
  },
  {
    topicNumber: 7,
    title: 'prompt engneering with react for 5 days',
    duration: '5 days',
    week: 2,
    status: 'OPEN',
    content: `### Topic 7: Prompt Engineering with React Integration
**Duration**: 5 Days | **Level**: Advanced

#### Overview
Build AI-powered React web applications leveraging structured prompt engineering, LLM API calls, streaming responses, and UI state management.

#### Curriculum
- **Day 1**: System Prompts, Few-shot prompting, and JSON mode outputs
- **Day 2**: Integrating OpenAI / Gemini API in React frontend applications
- **Day 3**: Handling streaming responses (\`EventSource\` / ReadableStreams)
- **Day 4**: Context window management & dynamic context injection
- **Day 5**: Building an AI Assistant Widget with custom React hooks`,
  },
  {
    topicNumber: 8,
    title: 'Nmap for 3 days',
    duration: '3 days',
    week: 2,
    status: 'OPEN',
    content: `### Topic 8: Nmap Network Scanning & Security Auditing
**Duration**: 3 Days | **Level**: Intermediate

#### Overview
Learn network discovery and vulnerability scanning using Nmap (Network Mapper).

#### Core Concepts
- Host discovery and ping sweeps (\`nmap -sn\`)
- Port scanning techniques (SYN scan \`-sS\`, Connect scan \`-sT\`, UDP scan \`-sU\`)
- Service version detection (\`-sV\`) and OS detection (\`-O\`)
- Using Nmap Scripting Engine (NSE) for security auditing`,
  },
  {
    topicNumber: 9,
    title: 'wireshark for 2 days',
    duration: '2 days',
    week: 3,
    status: 'OPEN',
    content: `### Topic 9: Wireshark Packet Analysis & Traffic Inspection
**Duration**: 2 Days | **Level**: Intermediate

#### Overview
Inspect live network traffic, analyze TCP/IP three-way handshakes, HTTP/HTTPS headers, and troubleshoot network latency issues.

#### Exercises
1. Capturing HTTP requests and filtering by protocol (\`http\`, \`dns\`, \`tcp.port == 443\`)
2. Analyzing TCP retransmissions, latency, and packet loss
3. Exporting packet captures (.pcap) for analysis`,
  },
  {
    topicNumber: 10,
    title: 'python for 5 days',
    duration: '5 days',
    week: 3,
    status: 'OPEN',
    content: `### Topic 10: Python Essentials & Backend Scripting
**Duration**: 5 Days | **Level**: Intermediate

#### Overview
Master Python data structures, object-oriented programming, REST API development with FastAPI / Flask, and script automation.

#### Syllabus
- **Day 1**: Data structures (Lists, Dicts, Sets, Tuples, List Comprehensions)
- **Day 2**: Object-Oriented Programming (Classes, Inheritance, Dunder Methods)
- **Day 3**: File I/O, AsyncIO, and JSON parsing
- **Day 4**: Building REST APIs with FastAPI / Flask
- **Day 5**: Database integration with SQLAlchemy / asyncpg`,
  },
  {
    topicNumber: 11,
    title: 'javascript for 5 days',
    duration: '5 days',
    week: 3,
    status: 'OPEN',
    content: `### Topic 11: JavaScript Deep Dive & ES6+ Features
**Duration**: 5 Days | **Level**: Advanced

#### Overview
In-depth JavaScript engine fundamentals, Event Loop, Closures, Prototypes, Promises, and Async/Await.

#### Deep Dive Topics
- Execution Context, Call Stack, and Microtask Queue
- Lexical Scope & Closures
- Prototype Chain and ES6 Class Syntax
- Asynchronous JS: Promises, \`Promise.allSettled\`, Async Generators
- Functional Programming Concepts (Immutability, Map, Reduce, Filter)`,
  },
  {
    topicNumber: 12,
    title: 'type script for 5 days',
    duration: '5 days',
    week: 3,
    status: 'OPEN',
    content: `### Topic 12: Production TypeScript Architecture
**Duration**: 5 Days | **Level**: Advanced

#### Overview
Master TypeScript type system, generics, utility types, mapped types, conditional types, and strict mode compiler options.

#### Key Skills
- Generics (\`<T>\`, \`keyof T\`, \`Record<K, V>\`)
- Utility Types (\`Partial\`, \`Pick\`, \`Omit\`, \`Readonly\`, \`ReturnType\`)
- Discriminated Unions and Type Guards (\`is\` keyword)
- Setting up strict \`tsconfig.json\` for React & Node.js projects`,
  },
];

export const getCoInternTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let topics = await db.coInternStudyTopic.findMany({
      orderBy: { topicNumber: 'asc' },
    });

    if (topics.length === 0) {
      for (const item of INITIAL_CO_INTERN_TOPICS) {
        await db.coInternStudyTopic.create({
          data: item,
        });
      }
      topics = await db.coInternStudyTopic.findMany({
        orderBy: { topicNumber: 'asc' },
      });
    }

    res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleCoInternTopicStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role === 'EMPLOYEE') {
      res.status(403).json({ success: false, message: 'Admin access required.' });
      return;
    }

    const topicId = String(req.params.id);
    const existing = await db.coInternStudyTopic.findUnique({ where: { id: topicId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    const newStatus = existing.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const updated = await db.coInternStudyTopic.update({
      where: { id: topicId },
      data: { status: newStatus },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: `Topic status changed to ${newStatus}`,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCoInternTopicContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user?.role;
    if (role === 'EMPLOYEE') {
      res.status(403).json({ success: false, message: 'Admin access required.' });
      return;
    }

    const topicId = String(req.params.id);
    const { title, duration, content, status } = req.body;

    const existing = await db.coInternStudyTopic.findUnique({ where: { id: topicId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Topic not found.' });
      return;
    }

    const updated = await db.coInternStudyTopic.update({
      where: { id: topicId },
      data: {
        ...(title !== undefined && { title }),
        ...(duration !== undefined && { duration }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Co-Intern topic updated successfully!',
    });
  } catch (err) {
    next(err);
  }
};

