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
