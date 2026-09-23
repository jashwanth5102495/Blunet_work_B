export interface StudyCodingTaskItem {
  id: string;
  taskNumber: number;
  month: number;
  category: 'JavaScript' | 'TypeScript';
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  instructions: string;
  starterCode: string;
  solutionCode: string;
  hint: string;
}

export const MONTH_1_CODING_TASKS: StudyCodingTaskItem[] = Array.from({ length: 40 }, (_, index) => {
  const taskNumber = index + 1;
  const isJs = taskNumber <= 20;
  const category = isJs ? 'JavaScript' : 'TypeScript';

  if (taskNumber === 1) {
    return {
      id: 'task-m1-01',
      taskNumber: 1,
      month: 1,
      category: 'JavaScript',
      title: 'Variable Declarations & Scope Check',
      difficulty: 'EASY',
      instructions: 'Declare a constant named `COMPANY_NAME` with value "BluNet IT Services" and a reassignable variable `taskStatus` initialized to "PENDING". Reassign `taskStatus` to "COMPLETED" and return an object with both.',
      starterCode: '// Write your function solution below\nfunction getCompanyConfig() {\n  // Your code here\n}',
      solutionCode: 'function getCompanyConfig() {\n  const COMPANY_NAME = "BluNet IT Services";\n  let taskStatus = "PENDING";\n  taskStatus = "COMPLETED";\n  return { COMPANY_NAME, taskStatus };\n}',
      hint: 'Use `const` for fixed strings and `let` for variables that will be reassigned.',
    };
  }

  if (taskNumber === 2) {
    return {
      id: 'task-m1-02',
      taskNumber: 2,
      month: 1,
      category: 'JavaScript',
      title: 'Calculate Array Averages',
      difficulty: 'EASY',
      instructions: 'Write a function `calculateAverage(numbers)` that returns the mean average of an array of numbers. Return 0 if array is empty.',
      starterCode: 'function calculateAverage(numbers) {\n  // Write implementation\n}',
      solutionCode: 'function calculateAverage(numbers) {\n  if (!numbers || numbers.length === 0) return 0;\n  const sum = numbers.reduce((acc, num) => acc + num, 0);\n  return sum / numbers.length;\n}',
      hint: 'Use `Array.prototype.reduce()` to aggregate array values.',
    };
  }

  if (taskNumber === 3) {
    return {
      id: 'task-m1-03',
      taskNumber: 3,
      month: 1,
      category: 'JavaScript',
      title: 'Filter Active Tasks',
      difficulty: 'EASY',
      instructions: 'Given an array of task objects with `{ id, title, status }`, write a function `filterPendingTasks(tasks)` that returns only tasks with status equal to "TODO" or "IN_PROGRESS".',
      starterCode: 'function filterPendingTasks(tasks) {\n  // Filter tasks\n}',
      solutionCode: 'function filterPendingTasks(tasks) {\n  return tasks.filter(t => t.status === "TODO" || t.status === "IN_PROGRESS");\n}',
      hint: 'Use `tasks.filter(...)` with logical OR `||`.',
    };
  }

  if (taskNumber === 4) {
    return {
      id: 'task-m1-04',
      taskNumber: 4,
      month: 1,
      category: 'JavaScript',
      title: 'Format Currency & Revenue',
      difficulty: 'EASY',
      instructions: 'Write a function `formatINR(amount)` that converts a numeric value into an Indian Rupee string format (e.g. 50000 -> "₹50,000").',
      starterCode: 'function formatINR(amount) {\n  // Format currency\n}',
      solutionCode: 'function formatINR(amount) {\n  return "₹" + Number(amount).toLocaleString("en-IN");\n}',
      hint: 'Use `Number.prototype.toLocaleString("en-IN")`.',
    };
  }

  if (taskNumber === 5) {
    return {
      id: 'task-m1-05',
      taskNumber: 5,
      month: 1,
      category: 'JavaScript',
      title: 'Async Promise Delayer',
      difficulty: 'MEDIUM',
      instructions: 'Write an async function `delay(ms)` that returns a Promise resolving after the specified milliseconds delay.',
      starterCode: 'function delay(ms) {\n  // Return promise\n}',
      solutionCode: 'function delay(ms) {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}',
      hint: 'Return a `new Promise(resolve => setTimeout(resolve, ms))`.',
    };
  }

  if (taskNumber === 21) {
    return {
      id: 'task-m1-21',
      taskNumber: 21,
      month: 1,
      category: 'TypeScript',
      title: 'Employee Interface & Contract',
      difficulty: 'EASY',
      instructions: 'Define a TypeScript interface `EmployeeUser` with `id: string`, `name: string`, `role: "EMPLOYEE" | "ADMIN"`, and optional `department?: string`. Write a function `createEmployeeUser` returning this interface.',
      starterCode: 'interface EmployeeUser {\n  // Define fields\n}\n\nfunction createEmployeeUser(data: EmployeeUser): EmployeeUser {\n  return data;\n}',
      solutionCode: 'interface EmployeeUser {\n  id: string;\n  name: string;\n  role: "EMPLOYEE" | "ADMIN";\n  department?: string;\n}\n\nfunction createEmployeeUser(data: EmployeeUser): EmployeeUser {\n  return data;\n}',
      hint: 'Use string literal unions for role and `?` for optional properties.',
    };
  }

  if (taskNumber === 22) {
    return {
      id: 'task-m1-22',
      taskNumber: 22,
      month: 1,
      category: 'TypeScript',
      title: 'Generic ApiResponse Wrapper',
      difficulty: 'MEDIUM',
      instructions: 'Create a generic interface `ApiResponse<T>` with boolean `success`, `data: T`, and optional string `message?`. Write a generic helper `wrapResponse<T>(data: T)` returning `ApiResponse<T>`.',
      starterCode: 'interface ApiResponse<T> {\n  // Generic fields\n}\n\nfunction wrapResponse<T>(data: T): ApiResponse<T> {\n  // Implementation\n}',
      solutionCode: 'interface ApiResponse<T> {\n  success: boolean;\n  data: T;\n  message?: string;\n}\n\nfunction wrapResponse<T>(data: T): ApiResponse<T> {\n  return { success: true, data };\n}',
      hint: 'Use generic type parameter `<T>` on both the interface and function signature.',
    };
  }

  // Generative template for remaining tasks (6-20 JS, 23-40 TS)
  const taskTitle = isJs
    ? `JavaScript Coding Challenge #${taskNumber}`
    : `TypeScript Type-Safety Challenge #${taskNumber}`;
  
  const difficulty = taskNumber % 3 === 0 ? 'HARD' : taskNumber % 2 === 0 ? 'MEDIUM' : 'EASY';

  return {
    id: `task-m1-${taskNumber.toString().padStart(2, '0')}`,
    taskNumber,
    month: 1,
    category,
    title: taskTitle,
    difficulty,
    instructions: `Month 1 ${category} Task #${taskNumber}: Write a production-ready function to solve problem #${taskNumber}.`,
    starterCode: `function solveTask${taskNumber}(input) {\n  // Write solution for Task #${taskNumber}\n  return input;\n}`,
    solutionCode: `function solveTask${taskNumber}(input) {\n  return input;\n}`,
    hint: `Review ${category} Module ${Math.ceil(taskNumber / 3)} materials for reference.`,
  };
});
