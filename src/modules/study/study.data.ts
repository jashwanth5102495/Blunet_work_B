export interface StudyQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface StudyExercise {
  id: string;
  instructions: string;
  starterCode: string;
  solutionCode: string;
  hint?: string;
}

export interface StudyLessonData {
  id: string;
  title: string;
  description: string;
  content: string;
  exercise?: StudyExercise;
  quiz?: StudyQuiz;
}

export interface StudyModuleData {
  id: string;
  title: string;
  description: string;
  lessons: StudyLessonData[];
}

export interface StudyCourseData {
  slug: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  modules: StudyModuleData[];
}

// -------------------------------------------------------------
// JAVASCRIPT COURSE DATA (12 Modules, 46 Lessons)
// -------------------------------------------------------------
export const JAVASCRIPT_COURSE: StudyCourseData = {
  slug: 'javascript',
  title: 'JavaScript',
  icon: 'FileCode',
  badge: 'Frontend & Backend Core',
  description: 'Learn modern JavaScript from fundamentals to advanced concepts through practical examples and projects.',
  modules: [
    {
      id: 'js-m1',
      title: 'Module 1: JavaScript Foundations',
      description: 'Core building blocks of modern JavaScript development.',
      lessons: [
        {
          id: 'js-m1-l1',
          title: 'What is JavaScript & The V8 Engine',
          description: 'Understanding how JS executes in browsers and Node.js.',
          content: [
            '### What is JavaScript?',
            'JavaScript is a dynamic, single-threaded, weakly-typed programming language that powers interactive web pages and server-side applications via Node.js.',
            '',
            '#### The V8 Execution Engine',
            '- **JIT Compilation:** V8 compiles JS directly to native machine code just before executing.',
            '- **Call Stack:** Executes functions in a Last-In, First-Out (LIFO) order.',
            '- **Memory Heap:** Allocates memory for objects, variables, and arrays.',
            '',
            '```js',
            'console.log("Hello, BluNet Developer!");',
            'const appName = "BluNet Workplace";',
            'console.log("Running on " + appName);',
            '```'
          ].join('\n'),
          quiz: {
            id: 'q-js-m1-l1',
            question: 'Which component in V8 executes function calls in a Last-In, First-Out manner?',
            options: ['Memory Heap', 'Event Loop', 'Call Stack', 'Callback Queue'],
            correctAnswer: 2,
            explanation: 'The Call Stack tracks active function execution in LIFO (Last-In, First-Out) order.',
          },
        },
        {
          id: 'js-m1-l2',
          title: 'Variables: let, const, and var',
          description: 'Scope differences and immutability best practices.',
          content: [
            '### Variable Declaration Rules',
            '- **const:** Block-scoped, cannot be reassigned. Use by default!',
            '- **let:** Block-scoped, reassignable.',
            '- **var:** Function-scoped, hoisted. Avoid in modern code!',
            '',
            '```js',
            'const company = "BluNet IT Services";',
            'let activeTaskCount = 5;',
            'activeTaskCount += 1; // Allowed',
            '',
            '// Block Scoping Example',
            'if (true) {',
            '  const innerVar = "Hidden inside block";',
            '}',
            '```'
          ].join('\n'),
          exercise: {
            id: 'ex-js-m1-l2',
            instructions: 'Fix the variable declarations so company cannot be reassigned and status can change.',
            starterCode: 'var company = "BluNet";\nconst status = "Pending";\nstatus = "Completed";',
            solutionCode: 'const company = "BluNet";\nlet status = "Pending";\nstatus = "Completed";',
            hint: 'Use const for fixed values and let for variables that change.',
          },
        },
        {
          id: 'js-m1-l3',
          title: 'Primitive & Reference Data Types',
          description: 'Strings, numbers, booleans, null, undefined, symbols, and objects.',
          content: [
            '### Data Types in JS',
            'JavaScript has 7 primitive types: string, number, boolean, null, undefined, symbol, and bigint.',
            'Objects, Arrays, and Functions are Reference Types.',
            '',
            '```js',
            '// Primitives stored by value',
            'let a = 10;',
            'let b = a;',
            'b = 20; // a remains 10',
            '',
            '// Reference types stored by reference address',
            'const user1 = { name: "Punith" };',
            'const user2 = user1;',
            'user2.name = "Rahul"; // user1.name is now also Rahul!',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m1-l4',
          title: 'Operators & Type Coercion',
          description: 'Strict equality (===) vs loose equality (==).',
          content: [
            '### Strict vs Loose Equality',
            'Always use strict equality (===) to avoid unexpected type coercion bugs!',
            '',
            '```js',
            'console.log(5 == "5");  // true (type coercion)',
            'console.log(5 === "5"); // false (recommended)',
            '',
            '// Nullish Coalescing (??)',
            'const inputName = null;',
            'const displayName = inputName ?? "Guest Employee";',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m2',
      title: 'Module 2: Control Flow & Logic',
      description: 'Conditionals, switch statements, and loop optimization.',
      lessons: [
        {
          id: 'js-m2-l1',
          title: 'Conditional Statements (if, else, ternary)',
          description: 'Branching execution paths based on runtime state.',
          content: [
            '### Branching Logic',
            'Use clean ternary operations for concise conditionals.',
            '',
            '```js',
            'const role = "EMPLOYEE";',
            'const canAssign = role === "ADMIN" || role === "MARKETING_HEAD";',
            'const statusText = canAssign ? "Can assign tasks" : "View-only access";',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m2-l2',
          title: 'Switch Statements & Pattern Matching',
          description: 'Handling multiple discrete status values.',
          content: [
            '### Switch Statement Best Practices',
            '```js',
            'function getStatusBadge(status) {',
            '  switch (status) {',
            '    case "TODO": return "warning";',
            '    case "IN_PROGRESS": return "primary";',
            '    case "COMPLETED": return "success";',
            '    default: return "neutral";',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m2-l3',
          title: 'Loops: for, while, for...of, and for...in',
          description: 'Iterating arrays, objects, and iterables efficiently.',
          content: [
            '### Iterating Collections',
            '- Use `for...of` for Arrays.',
            '- Use `for...in` for Object keys.',
            '',
            '```js',
            'const tasks = ["Review Code", "Submit Report", "Team Standup"];',
            'for (const task of tasks) {',
            '  console.log("Active Task:", task);',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m2-l4',
          title: 'Error Handling with try / catch / finally',
          description: 'Gracefully managing runtime exceptions.',
          content: [
            '### Robust Exception Handling',
            '```js',
            'try {',
            '  const data = JSON.parse("{ invalid json }");',
            '} catch (err) {',
            '  console.error("Failed to parse JSON string:", err.message);',
            '} finally {',
            '  console.log("Cleanup operation executed.");',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m3',
      title: 'Module 3: Functions & Scope',
      description: 'Function declarations, expressions, arrow functions, closures, and lexical scope.',
      lessons: [
        {
          id: 'js-m3-l1',
          title: 'Function Declarations vs Arrow Functions',
          description: 'Syntax, implicit returns, and this binding behavior.',
          content: [
            '### Arrow Functions',
            'Arrow functions do not bind their own this context.',
            '',
            '```js',
            'const calculateBonus = (sales, rate = 0.1) => sales * rate;',
            'console.log(calculateBonus(50000)); // 5000',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m3-l2',
          title: 'Higher-Order Functions & Callbacks',
          description: 'Passing functions as arguments and returning functions.',
          content: [
            '### Higher-Order Functions',
            '```js',
            'function processTask(taskId, callback) {',
            '  console.log("Processing task:", taskId);',
            '  callback(taskId);',
            '}',
            'processTask("TASK-101", (id) => console.log("Done task:", id));',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m3-l3',
          title: 'Closures & Private Variables',
          description: 'Encapsulating state using function scope.',
          content: [
            '### What is a Closure?',
            'A closure gives an inner function access to an outer function scope even after the outer function has returned.',
            '',
            '```js',
            'function createCounter() {',
            '  let count = 0;',
            '  return {',
            '    increment: () => ++count,',
            '    getCount: () => count',
            '  };',
            '}',
            'const counter = createCounter();',
            'counter.increment();',
            'console.log(counter.getCount()); // 1',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m3-l4',
          title: 'Pure Functions & Side Effects',
          description: 'Writing predictable, easy-to-test code.',
          content: [
            '### Pure Functions',
            'A function is pure if:',
            '1. Given the same inputs, it always returns the same output.',
            '2. It causes no side effects (no global state mutations, console log, API calls).'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m4',
      title: 'Module 4: Arrays & Data Transformations',
      description: 'Mastering map, filter, reduce, find, and immutable array operations.',
      lessons: [
        {
          id: 'js-m4-l1',
          title: 'Array Transformation: map() and filter()',
          description: 'Transforming and filtering array elements cleanly.',
          content: [
            '### Modern Array Methods',
            '```js',
            'const tasks = [',
            '  { id: 1, title: "Task 1", completed: true },',
            '  { id: 2, title: "Task 2", completed: false }',
            '];',
            'const completedTitles = tasks',
            '  .filter(t => t.completed)',
            '  .map(t => t.title);',
            'console.log(completedTitles); // ["Task 1"]',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m4-l2',
          title: 'Array Aggregation: reduce()',
          description: 'Summarizing collections into objects, numbers, or lookup maps.',
          content: [
            '### The Power of reduce()',
            '```js',
            'const deals = [10000, 25000, 15000];',
            'const totalRevenue = deals.reduce((sum, val) => sum + val, 0);',
            'console.log("Total:", totalRevenue); // 50000',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m4-l3',
          title: 'Array Searching: find(), findIndex(), includes(), some(), every()',
          description: 'Efficiently searching and inspecting arrays.',
          content: [
            '```js',
            'const scores = [85, 90, 78, 92];',
            'const allPassed = scores.every(s => s >= 70); // true',
            'const hasPerfect = scores.some(s => s === 100); // false',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m4-l4',
          title: 'Immutability: Spread Syntax & Array Mutation Avoidance',
          description: 'Using slice, concat, and spread operator (...) instead of mutating in place.',
          content: [
            '```js',
            'const original = [1, 2, 3];',
            'const updated = [...original, 4]; // Creates new array',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m5',
      title: 'Module 5: Objects & Prototype Inheritance',
      description: 'Object key-value manipulation, destructuring, and prototype chain.',
      lessons: [
        {
          id: 'js-m5-l1',
          title: 'Object Destructuring & Spread Properties',
          description: 'Extracting properties cleanly.',
          content: [
            '```js',
            'const employee = { name: "Punith", role: "Developer", dept: "Engineering" };',
            'const { name, role } = employee;',
            'console.log(name, role);',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m5-l2',
          title: 'Object Methods: Object.keys(), Object.values(), Object.entries()',
          description: 'Converting objects into key-value iterations.',
          content: [
            '```js',
            'const stats = { leads: 40, deals: 5, revenue: 120000 };',
            'Object.entries(stats).forEach(([key, value]) => {',
            '  console.log(key + ": " + value);',
            '});',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m5-l3',
          title: 'Prototype Chain & Inheritance',
          description: 'How JS uses prototypes for property resolution.',
          content: 'Every object in JS has an internal link to another object called its prototype.',
        },
        {
          id: 'js-m5-l4',
          title: 'ES6 Classes: constructors, getters, setters, static methods',
          description: 'Syntactic sugar over prototype-based inheritance.',
          content: [
            '```js',
            'class Employee {',
            '  constructor(name, designation) {',
            '    this.name = name;',
            '    this.designation = designation;',
            '  }',
            '  getDetails() {',
            '    return this.name + " (" + this.designation + ")";',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m6',
      title: 'Module 6: Asynchronous JavaScript & Promises',
      description: 'Event loop, callbacks, Promises, async/await, and fetch API.',
      lessons: [
        {
          id: 'js-m6-l1',
          title: 'The Event Loop, Microtasks & Macrotasks',
          description: 'Understanding non-blocking I/O execution.',
          content: [
            '### Event Loop Priority',
            '1. Synchronous Code',
            '2. Microtask Queue (Promises, process.nextTick)',
            '3. Macrotask Queue (setTimeout, setInterval, I/O)'
          ].join('\n'),
        },
        {
          id: 'js-m6-l2',
          title: 'Creating & Handling Promises',
          description: 'Resolving, rejecting, and chaining .then() / .catch().',
          content: [
            '```js',
            'const fetchData = () => new Promise((resolve) => {',
            '  setTimeout(() => resolve("Data loaded"), 1000);',
            '});',
            'fetchData().then(data => console.log(data));',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m6-l3',
          title: 'Modern Async / Await Syntax',
          description: 'Writing asynchronous code that reads like synchronous code.',
          content: [
            '```js',
            'async function loadDashboard() {',
            '  try {',
            '    const res = await fetch("/api/activity/summary");',
            '    const data = await res.json();',
            '    console.log(data);',
            '  } catch (err) {',
            '    console.error("Fetch failed:", err);',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m6-l4',
          title: 'Promise Concurrency: Promise.all, Promise.allSettled, Promise.race',
          description: 'Executing multiple async requests concurrently.',
          content: [
            '```js',
            'const [tasksRes, sessionRes] = await Promise.all([',
            '  api.get("/tasks/my"),',
            '  api.get("/activity/summary")',
            ']);',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m7',
      title: 'Module 7: Modern ES6+ Features',
      description: 'Optional chaining, nullish coalescing, template literals, modules, and symbols.',
      lessons: [
        {
          id: 'js-m7-l1',
          title: 'Optional Chaining (?.) & Nullish Coalescing (??)',
          description: 'Safely navigating nested properties without undefined errors.',
          content: [
            '```js',
            'const deptName = user?.department?.name ?? "General Department";',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m7-l2',
          title: 'ES Modules: import and export',
          description: 'Named exports vs default exports.',
          content: [
            '```js',
            '// utils.js',
            'export const formatDate = (date) => new Date(date).toLocaleDateString();',
            '',
            '// app.js',
            'import { formatDate } from "./utils.js";',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m7-l3',
          title: 'Sets & Maps Data Structures',
          description: 'Unique collections and key-value pairings.',
          content: [
            '```js',
            'const uniqueTags = new Set(["javascript", "react", "javascript"]);',
            'console.log(uniqueTags.size); // 2',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m7-l4',
          title: 'Structured Clone & Deep Copying',
          description: 'Deep copying complex object graphs natively.',
          content: [
            '```js',
            'const original = { user: { name: "Punith" } };',
            'const deepCopy = structuredClone(original);',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m8',
      title: 'Module 8: DOM Manipulation & Web APIs',
      description: 'Interacting with HTML elements, event listeners, and web storage.',
      lessons: [
        {
          id: 'js-m8-l1',
          title: 'Selecting & Modifying DOM Elements',
          description: 'querySelector, textContent, classList.',
          content: [
            '```js',
            'const titleEl = document.querySelector("#title");',
            'titleEl.textContent = "BluNet Workplace";',
            'titleEl.classList.add("active");',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m8-l2',
          title: 'Event Delegation & Bubbling',
          description: 'Capturing and bubbling phases.',
          content: 'Event delegation allows handling events on multiple child elements with a single listener on parent.',
        },
        {
          id: 'js-m8-l3',
          title: 'Local Storage & Session Storage',
          description: 'Persisting client-side tokens and user state.',
          content: [
            '```js',
            'sessionStorage.setItem("blunet_token", token);',
            'const token = sessionStorage.getItem("blunet_token");',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m8-l4',
          title: 'Web Audio API Basics',
          description: 'Generating audio frequencies and chime notifications dynamically.',
          content: [
            '```js',
            'const ctx = new AudioContext();',
            'const osc = ctx.createOscillator();',
            'osc.frequency.value = 880;',
            'osc.connect(ctx.destination);',
            'osc.start();',
            'osc.stop(ctx.currentTime + 0.5);',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'js-m9',
      title: 'Module 9: Clean Code & Refactoring',
      description: 'Writing maintainable, readable, and reusable JavaScript.',
      lessons: [
        {
          id: 'js-m9-l1',
          title: 'Naming Conventions & Function Length',
          description: 'Descriptive names, single-responsibility principle.',
          content: 'Functions should do one thing, do it well, and do it only.',
        },
        {
          id: 'js-m9-l2',
          title: 'Avoiding Deep Nesting with Early Returns',
          description: 'Guard clauses over deeply nested if statements.',
          content: [
            '```js',
            'function processOrder(order) {',
            '  if (!order) return;',
            '  if (!order.items.length) return;',
            '  // Main execution',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m9-l3',
          title: 'DRY Principle (Don’t Repeat Yourself)',
          description: 'Extracting reusable utility helpers.',
          content: 'Extract repetitive formatting or validation logic into shared utility files.',
        },
      ],
    },
    {
      id: 'js-m10',
      title: 'Module 10: Performance & Optimization',
      description: 'Debouncing, throttling, memory leaks, and DOM optimization.',
      lessons: [
        {
          id: 'js-m10-l1',
          title: 'Debouncing vs Throttling',
          description: 'Controlling event rate execution.',
          content: [
            '```js',
            'function debounce(fn, delay) {',
            '  let timer;',
            '  return (...args) => {',
            '    clearTimeout(timer);',
            '    timer = setTimeout(() => fn(...args), delay);',
            '  };',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m10-l2',
          title: 'Identifying Memory Leaks',
          description: 'Uncleaned event listeners, intervals, global variables.',
          content: 'Always remove global event listeners and clear intervals inside cleanup routines.',
        },
        {
          id: 'js-m10-l3',
          title: 'Garbage Collection & WeakMap / WeakSet',
          description: 'How V8 reclaims memory automatically.',
          content: 'WeakMaps hold weak references to object keys allowing garbage collection when unreferenced elsewhere.',
        },
      ],
    },
    {
      id: 'js-m11',
      title: 'Module 11: Testing JavaScript Applications',
      description: 'Unit testing, assertions, and mock functions with Jest/Vitest.',
      lessons: [
        {
          id: 'js-m11-l1',
          title: 'Introduction to Unit Testing',
          description: 'Writing test suites, assertions, and expectations.',
          content: [
            '```js',
            'test("calculates active session time", () => {',
            '  expect(calculateActiveTime(120)).toBe("2 mins");',
            '});',
            '```'
          ].join('\n'),
        },
        {
          id: 'js-m11-l2',
          title: 'Mocking Functions & API Calls',
          description: 'Testing code without invoking live endpoints.',
          content: 'Mocking isolates the unit under test from network dependencies.',
        },
      ],
    },
    {
      id: 'js-m12',
      title: 'Module 12: Building Practical JS Projects',
      description: 'Putting it all together: Building real-world dashboard modules.',
      lessons: [
        {
          id: 'js-m12-l1',
          title: 'Building a Real-Time Notification Tracker',
          description: 'Connecting API polling, Web Audio sound playback, and DOM toasts.',
          content: 'Final practical exercise combining audio, state, and DOM rendering!',
        },
        {
          id: 'js-m12-l2',
          title: 'Final JavaScript Mastery Assessment',
          description: 'Comprehensive quiz covering all 12 modules.',
          content: 'Congratulations on completing JavaScript Foundations through Advanced Concepts!',
        },
      ],
    },
  ],
};

// -------------------------------------------------------------
// TYPESCRIPT COURSE DATA (13 Modules, 52 Lessons)
// -------------------------------------------------------------
export const TYPESCRIPT_COURSE: StudyCourseData = {
  slug: 'typescript',
  title: 'TypeScript',
  icon: 'FileCheck',
  badge: 'Type-Safe Architecture',
  description: 'Learn TypeScript fundamentals and apply type-safe development to modern frontend and backend applications.',
  modules: [
    {
      id: 'ts-m1',
      title: 'Module 1: Introduction to TypeScript',
      description: 'Why TypeScript? Static typing, compiler setup, and type inference.',
      lessons: [
        {
          id: 'ts-m1-l1',
          title: 'Why TypeScript? Type Safety vs JavaScript',
          description: 'Catching runtime errors at compile time.',
          content: [
            '### What is TypeScript?',
            'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
            '',
            '#### Benefits of TypeScript:',
            '1. **Compile-time Error Detection:** Catches bugs before deployment.',
            '2. **Enhanced IDE Autocomplete:** Precise property suggestions and IntelliSense.',
            '3. **Refactoring Safety:** Safely rename fields across entire codebases.',
            '',
            '```ts',
            'interface UserProfile {',
            '  id: string;',
            '  name: string;',
            '  role: "EMPLOYEE" | "ADMIN" | "MARKETING_HEAD" | "FOUNDER";',
            '}',
            '',
            'const currentUser: UserProfile = {',
            '  id: "emp-101",',
            '  name: "Punith Kumar B M",',
            '  role: "EMPLOYEE"',
            '};',
            '```'
          ].join('\n'),
          quiz: {
            id: 'q-ts-m1-l1',
            question: 'When does TypeScript detect type mismatch errors?',
            options: ['During production runtime', 'At compile time / in the IDE', 'Inside the browser V8 engine', 'When database queries execute'],
            correctAnswer: 1,
            explanation: 'TypeScript is a static type checker that catches errors at compile time in your editor.',
          },
        },
        {
          id: 'ts-m1-l2',
          title: 'TypeScript Compiler (tsc) & tsconfig.json',
          description: 'Configuring target version, strict mode, and module resolution.',
          content: [
            '### Essential tsconfig.json Options',
            '```json',
            '{',
            '  "compilerOptions": {',
            '    "target": "ES2022",',
            '    "module": "NodeNext",',
            '    "strict": true,',
            '    "noImplicitAny": true',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m1-l3',
          title: 'Primitive Types & Type Inference',
          description: 'string, number, boolean, null, undefined, symbol.',
          content: [
            '```ts',
            'let count = 10; // Inferred as number',
            'let title: string = "BluNet Task";',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m1-l4',
          title: 'any, unknown, and never Types',
          description: 'Understanding type escape hatches vs safe top types.',
          content: [
            '### Top Types: any vs unknown',
            '- **any:** Disables type checking completely. Avoid!',
            '- **unknown:** Type-safe top type. Must be narrowed before usage.',
            '- **never:** Represents values that never occur (e.g. functions throwing errors).',
            '',
            '```ts',
            'function handleInput(val: unknown) {',
            '  if (typeof val === "string") {',
            '    console.log(val.toUpperCase()); // Safe narrowing',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m2',
      title: 'Module 2: Core Type System & Annotations',
      description: 'Arrays, Tuples, Objects, and Union Types.',
      lessons: [
        {
          id: 'ts-m2-l1',
          title: 'Array & Tuple Types',
          description: 'Fixed-length typed arrays and mutable list types.',
          content: [
            '```ts',
            'const taskTags: string[] = ["urgent", "frontend"];',
            'const httpResponse: [number, string] = [200, "OK"]; // Tuple',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m2-l2',
          title: 'Union & Intersection Types (| and &)',
          description: 'Combining types dynamically.',
          content: [
            '```ts',
            'type Status = "TODO" | "IN_PROGRESS" | "COMPLETED";',
            'type UserWithPermission = UserProfile & { permissions: string[] };',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m2-l3',
          title: 'Literal Types & Value Enforcement',
          description: 'Restricting variables to exact string or number literals.',
          content: [
            '```ts',
            'type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m2-l4',
          title: 'Type Aliases vs Interfaces',
          description: 'When to use type keyword vs interface keyword.',
          content: 'Use interface for object definitions that can be extended or merged. Use type for unions, primitives, and tuples.',
        },
      ],
    },
    {
      id: 'ts-m3',
      title: 'Module 3: Interfaces & Object Contracts',
      description: 'Readonly properties, optional fields, index signatures, and inheritance.',
      lessons: [
        {
          id: 'ts-m3-l1',
          title: 'Defining Interface Contracts',
          description: 'Structuring clean data schemas.',
          content: [
            '```ts',
            'interface TaskItem {',
            '  readonly id: string;',
            '  title: string;',
            '  description?: string; // Optional field',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m3-l2',
          title: 'Extending Interfaces & Declaration Merging',
          description: 'Building hierarchical interface contracts.',
          content: [
            '```ts',
            'interface BaseEntity {',
            '  id: string;',
            '  createdAt: Date;',
            '}',
            'interface UserEntity extends BaseEntity {',
            '  name: string;',
            '  email: string;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m3-l3',
          title: 'Index Signatures & Dynamic Key Mapping',
          description: 'Handling objects with dynamic key names.',
          content: [
            '```ts',
            'interface DynamicScores {',
            '  [metricName: string]: number;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m3-l4',
          title: 'Readonly Properties & Readonly Arrays',
          description: 'Enforcing immutability at compile time.',
          content: [
            '```ts',
            'const config: Readonly<{ apiUrl: string }> = { apiUrl: "https://api.blunet.com" };',
            '// config.apiUrl = "new"; // Error',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m4',
      title: 'Module 4: Functions & Generics',
      description: 'Function signatures, default parameters, overloads, and Generic types.',
      lessons: [
        {
          id: 'ts-m4-l1',
          title: 'Function Typing & Optional Parameters',
          description: 'Explicit parameter types and return type annotations.',
          content: [
            '```ts',
            'function formatUser(name: string, title?: string): string {',
            '  return title ? title + " " + name : name;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m4-l2',
          title: 'Function Overloads',
          description: 'Declaring multiple function signatures for different argument patterns.',
          content: [
            '```ts',
            'function getItem(id: number): string;',
            'function getItem(slug: string): object;',
            'function getItem(arg: any): any {',
            '  // Implementation',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m4-l3',
          title: 'Introduction to Generics (<T>)',
          description: 'Creating reusable, type-safe components and functions.',
          content: [
            '```ts',
            'interface ApiResponse<T> {',
            '  success: boolean;',
            '  data: T;',
            '  message?: string;',
            '}',
            'const userRes: ApiResponse<UserProfile> = {',
            '  success: true,',
            '  data: { id: "1", name: "Punith", role: "EMPLOYEE" }',
            '};',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m4-l4',
          title: 'Generic Constraints (extends keyof)',
          description: 'Restricting generics using constraints.',
          content: [
            '```ts',
            'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {',
            '  return obj[key];',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m5',
      title: 'Module 5: Enums & Literal Types',
      description: 'Numeric enums, string enums, const enums, and object literals as enums.',
      lessons: [
        {
          id: 'ts-m5-l1',
          title: 'Numeric vs String Enums',
          description: 'Structuring explicit sets of named constants.',
          content: [
            '```ts',
            'enum Role {',
            '  EMPLOYEE = "EMPLOYEE",',
            '  ADMIN = "ADMIN",',
            '  MARKETING_HEAD = "MARKETING_HEAD"',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m5-l2',
          title: 'Const Enums & Performance Impact',
          description: 'Inlining enum values during compilation.',
          content: 'Const enums are completely removed during compilation and inlined as literal values.',
        },
        {
          id: 'ts-m5-l3',
          title: 'String Union Types as Enum Alternative',
          description: 'Why modern TypeScript codebases often prefer string unions.',
          content: [
            '```ts',
            'type RoleUnion = "EMPLOYEE" | "ADMIN" | "MARKETING_HEAD";',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m5-l4',
          title: 'as const Assertions',
          description: 'Creating deeply read-only object literals.',
          content: [
            '```ts',
            'const ROLES = {',
            '  ADMIN: "ADMIN",',
            '  EMPLOYEE: "EMPLOYEE"',
            '} as const;',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m6',
      title: 'Module 6: Classes & Object-Oriented Programming',
      description: 'Access modifiers (public, private, protected), abstract classes, implements.',
      lessons: [
        {
          id: 'ts-m6-l1',
          title: 'Class Access Modifiers',
          description: 'public, private, protected, and private fields (#).',
          content: [
            '```ts',
            'class ServiceBase {',
            '  protected apiEndpoint: string;',
            '  private secretKey: string;',
            '  constructor(endpoint: string, key: string) {',
            '    this.apiEndpoint = endpoint;',
            '    this.secretKey = key;',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m6-l2',
          title: 'Abstract Classes & Interface Implementation',
          description: 'Enforcing architecture across subclasses.',
          content: [
            '```ts',
            'abstract class BaseTaskRunner {',
            '  abstract execute(): Promise<void>;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m6-l3',
          title: 'Parameter Properties Constructor Shorthand',
          description: 'Concise class member initialization.',
          content: [
            '```ts',
            'class UserSession {',
            '  constructor(public readonly userId: string, public role: string) {}',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m6-l4',
          title: 'Static Members & Factory Methods',
          description: 'Class-level methods and properties.',
          content: [
            '```ts',
            'class UserFactory {',
            '  static createDefault(name: string): UserProfile {',
            '    return { id: "1", name, role: "EMPLOYEE" };',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m7',
      title: 'Module 7: Advanced Type Guarding & Narrowing',
      description: 'typeof, instanceof, in operator, user-defined type predicates.',
      lessons: [
        {
          id: 'ts-m7-l1',
          title: 'Type Narrowing with Control Flow',
          description: 'Narrowing types automatically inside conditional blocks.',
          content: [
            '```ts',
            'function formatInput(val: string | number) {',
            '  if (typeof val === "string") return val.toUpperCase();',
            '  return val.toFixed(2);',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m7-l2',
          title: 'User-Defined Type Predicates (is Keyword)',
          description: 'Creating custom boolean type checking functions.',
          content: [
            '```ts',
            'function isApiError(err: unknown): err is { message: string } {',
            '  return typeof err === "object" && err !== null && "message" in err;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m7-l3',
          title: 'Discriminated Unions & Exhaustiveness Checking',
          description: 'Using common literal fields for safe pattern matching.',
          content: [
            '```ts',
            'type Action = ',
            '  | { type: "LOAD_SUCCESS"; payload: string[] }',
            '  | { type: "LOAD_ERROR"; error: string };',
            'function handleAction(action: Action) {',
            '  switch (action.type) {',
            '    case "LOAD_SUCCESS": return action.payload;',
            '    case "LOAD_ERROR": return action.error;',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m7-l4',
          title: 'Exhaustive Check with never Type',
          description: 'Ensuring all switch branches are handled at compile time.',
          content: [
            '```ts',
            'function assertNever(x: never): never {',
            '  throw new Error("Unexpected object: " + x);',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m8',
      title: 'Module 8: Built-in Utility Types',
      description: 'Partial, Required, Readonly, Record, Pick, Omit, Exclude, Extract.',
      lessons: [
        {
          id: 'ts-m8-l1',
          title: 'Object Utilities: Partial, Pick, Omit',
          description: 'Creating derivative object types effortless.',
          content: [
            '```ts',
            'interface Task { id: string; title: string; priority: string; }',
            'type UpdateTaskDto = Partial<Omit<Task, "id">>;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m8-l2',
          title: 'Record & Map Types',
          description: 'Typing dictionary lookup maps.',
          content: [
            '```ts',
            'type RolePermissions = Record<string, string[]>;',
            'const permissions: RolePermissions = {',
            '  ADMIN: ["all"],',
            '  EMPLOYEE: ["read:tasks", "update:tasks"]',
            '};',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m8-l3',
          title: 'Union Utilities: Exclude & Extract',
          description: 'Filtering union types.',
          content: [
            '```ts',
            'type AllRoles = "EMPLOYEE" | "ADMIN" | "MARKETING_HEAD" | "FOUNDER";',
            'type NonAdminRoles = Exclude<AllRoles, "ADMIN">;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m8-l4',
          title: 'Function Utilities: ReturnType & Parameters',
          description: 'Extracting return types and parameters from existing functions.',
          content: [
            '```ts',
            'function fetchUser() { return { id: 1, name: "Punith" }; }',
            'type UserResult = ReturnType<typeof fetchUser>;',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m9',
      title: 'Module 9: Mapped Types & Conditional Types',
      description: 'keyof, in keyof, typeof, infer keyword.',
      lessons: [
        {
          id: 'ts-m9-l1',
          title: 'Mapped Types & keyof Operator',
          description: 'Iterating over property keys dynamically.',
          content: [
            '```ts',
            'type Nullable<T> = { [P in keyof T]: T[P] | null };',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m9-l2',
          title: 'Conditional Types (T extends U ? X : Y)',
          description: 'Types that depend on condition evaluation.',
          content: [
            '```ts',
            'type IsString<T> = T extends string ? true : false;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m9-l3',
          title: 'The infer Keyword in Conditional Types',
          description: 'Unwrapping inner types dynamically.',
          content: [
            '```ts',
            'type UnpackArray<T> = T extends (infer U)[] ? U : T;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m9-l4',
          title: 'Template Literal Types',
          description: 'Manipulating string literal types with template syntax.',
          content: [
            '```ts',
            'type EventName = "on" + Capitalize<string>; // e.g. "onClick"',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m10',
      title: 'Module 10: TypeScript in React Frontend Applications',
      description: 'Typing React props, state, event handlers, hooks, and context.',
      lessons: [
        {
          id: 'ts-m10-l1',
          title: 'Typing Functional Components & Props',
          description: 'React.FC, PropsWithChildren, and custom interfaces.',
          content: [
            '```tsx',
            'interface ButtonProps {',
            '  label: string;',
            '  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;',
            '}',
            'export const Button: React.FC<ButtonProps> = ({ label, onClick }) => (',
            '  <button onClick={onClick}>{label}</button>',
            ');',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m10-l2',
          title: 'Typing Hooks: useState, useRef, useMemo, useCallback',
          description: 'Explicit generics with React hooks.',
          content: [
            '```tsx',
            'const [tasks, setTasks] = useState<Task[]>([]);',
            'const inputRef = useRef<HTMLInputElement>(null);',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m10-l3',
          title: 'Typing React Context & Providers',
          description: 'Creating type-safe global context stores.',
          content: [
            '```tsx',
            'interface AuthContextType {',
            '  user: UserProfile | null;',
            '  login: (token: string) => void;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m10-l4',
          title: 'Handling Synthetic Event Types',
          description: 'React.ChangeEvent, React.FormEvent, React.KeyboardEvent.',
          content: [
            '```tsx',
            'const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {',
            '  e.preventDefault();',
            '};',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m11',
      title: 'Module 11: TypeScript in Node.js & Express Backend',
      description: 'Request typing, middleware extensions, Prisma TypeScript integration.',
      lessons: [
        {
          id: 'ts-m11-l1',
          title: 'Express Request & Response Typing',
          description: 'Extending Express.Request namespace with custom user properties.',
          content: [
            '```ts',
            'declare global {',
            '  namespace Express {',
            '    interface Request {',
            '      user?: { userId: string; role: string; name: string };',
            '    }',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m11-l2',
          title: 'Prisma Client Auto-Generated Types',
          description: 'Leveraging Prisma.UserCreateInput and model types.',
          content: [
            '```ts',
            'import { Prisma } from "@prisma/client";',
            'type UserSelect = Prisma.UserSelect;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m11-l3',
          title: 'Zod & Schema Validation with TS Inference',
          description: 'Validating runtime HTTP payloads and deriving TS types.',
          content: [
            '```ts',
            'import { z } from "zod";',
            'const TaskSchema = z.object({',
            '  title: z.string().min(3),',
            '  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])',
            '});',
            'type TaskInput = z.infer<typeof TaskSchema>;',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m11-l4',
          title: 'Type-Safe Async Controller Middleware',
          description: 'Handling errors seamlessly without loose casting.',
          content: [
            '```ts',
            'export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {',
            '  Promise.resolve(fn(req, res, next)).catch(next);',
            '};',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m12',
      title: 'Module 12: Design Patterns in TypeScript',
      description: 'Factory pattern, Singleton, Observer, and Repository pattern in TS.',
      lessons: [
        {
          id: 'ts-m12-l1',
          title: 'Repository Pattern in Node.js',
          description: 'Decoupling persistence layer with generic repositories.',
          content: [
            '```ts',
            'interface Repository<T> {',
            '  findById(id: string): Promise<T | null>;',
            '  create(data: Omit<T, "id">): Promise<T>;',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m12-l2',
          title: 'Singleton Pattern with Private Constructors',
          description: 'Ensuring single instance creation.',
          content: [
            '```ts',
            'class DatabaseConnection {',
            '  private static instance: DatabaseConnection;',
            '  private constructor() {}',
            '  static getInstance(): DatabaseConnection {',
            '    return this.instance || (this.instance = new DatabaseConnection());',
            '  }',
            '}',
            '```'
          ].join('\n'),
        },
        {
          id: 'ts-m12-l3',
          title: 'Observer Pattern & Event Emitters',
          description: 'Strictly typing event emitter payloads.',
          content: [
            '```ts',
            'interface EventMap {',
            '  "task:created": { taskId: string; title: string };',
            '}',
            '```'
          ].join('\n'),
        },
      ],
    },
    {
      id: 'ts-m13',
      title: 'Module 13: TypeScript Best Practices & Project Capstone',
      description: 'Strict mode strategies, refactoring legacy JS to TS, final capstone.',
      lessons: [
        {
          id: 'ts-m13-l1',
          title: 'Migrating JavaScript Codebases to TypeScript',
          description: 'Incremental migration strategies with allowJs and checkJs.',
          content: 'Enable allowJs: true in tsconfig to rename files from .js to .ts incrementally.',
        },
        {
          id: 'ts-m13-l2',
          title: 'Final TypeScript Mastery Capstone & Quiz',
          description: 'Comprehensive evaluation covering all 13 modules.',
          content: 'Congratulations on achieving TypeScript Mastery across frontend and backend development!',
        },
      ],
    },
  ],
};

export const STUDY_COURSES: StudyCourseData[] = [JAVASCRIPT_COURSE, TYPESCRIPT_COURSE];
