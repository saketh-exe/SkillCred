import type { QuizQuestion, AssessmentResult } from '../types';
import { studentService } from './studentService';

const questionBank: Record<string, QuizQuestion[]> = {
  SQL: [
    { id: 'q1', question: 'Which SQL clause is used to filter rows returned by a query?', options: ['SELECT', 'WHERE', 'GROUP BY', 'ORDER BY'], correctIndex: 1 },
    { id: 'q2', question: 'What does the JOIN keyword do in SQL?', options: ['Deletes rows from two tables', 'Combines rows from two or more tables', 'Creates a new table', 'Sorts results'], correctIndex: 1 },
    { id: 'q3', question: 'Which aggregate function returns the number of rows?', options: ['SUM()', 'AVG()', 'COUNT()', 'MAX()'], correctIndex: 2 },
    { id: 'q4', question: 'What is a PRIMARY KEY constraint?', options: ['Allows null values', 'Uniquely identifies each row', 'References another table', 'Sorts records automatically'], correctIndex: 1 },
    { id: 'q5', question: 'Which SQL statement is used to update existing records?', options: ['MODIFY', 'ALTER', 'UPDATE', 'CHANGE'], correctIndex: 2 },
  ],
  Python: [
    { id: 'q1', question: 'What is a list comprehension in Python?', options: ['A way to create lists using a for loop and optional condition', 'A method to sort lists', 'A function to merge lists', 'A class for list management'], correctIndex: 0 },
    { id: 'q2', question: 'What does the "self" parameter refer to in a class method?', options: ['The class itself', 'The current instance', 'The parent class', 'A global variable'], correctIndex: 1 },
    { id: 'q3', question: 'Which keyword is used to handle exceptions in Python?', options: ['catch', 'except', 'handle', 'error'], correctIndex: 1 },
    { id: 'q4', question: 'What is a decorator in Python?', options: ['A function that modifies another function', 'A class attribute', 'A type of loop', 'A string formatting method'], correctIndex: 0 },
    { id: 'q5', question: 'What does "pip" stand for?', options: ['Python Install Package', 'Pip Installs Packages', 'Package Index for Python', 'Python Integrated Platform'], correctIndex: 1 },
  ],
  React: [
    { id: 'q1', question: 'What is the virtual DOM in React?', options: ['A copy of the browser DOM kept in memory', 'The actual browser DOM', 'A CSS framework', 'A testing utility'], correctIndex: 0 },
    { id: 'q2', question: 'What hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctIndex: 1 },
    { id: 'q3', question: 'What is JSX?', options: ['A JavaScript testing framework', 'A syntax extension for JavaScript', 'A CSS preprocessor', 'A database query language'], correctIndex: 1 },
    { id: 'q4', question: 'When does useEffect run by default?', options: ['Only on mount', 'Only on unmount', 'After every render', 'Before every render'], correctIndex: 2 },
    { id: 'q5', question: 'What is the purpose of keys in React lists?', options: ['Styling elements', 'Helping React identify which items changed', 'Creating unique URLs', 'Enabling animations'], correctIndex: 1 },
  ],
  Docker: [
    { id: 'q1', question: 'What is a Docker container?', options: ['A virtual machine', 'A lightweight isolated process', 'A programming language', 'A cloud service'], correctIndex: 1 },
    { id: 'q2', question: 'What file defines a Docker image?', options: ['docker-compose.yml', 'Dockerfile', 'package.json', 'config.yaml'], correctIndex: 1 },
    { id: 'q3', question: 'What is Docker Compose used for?', options: ['Building images', 'Defining multi-container applications', 'Monitoring containers', 'Deploying to cloud'], correctIndex: 1 },
    { id: 'q4', question: 'What does the EXPOSE instruction do in a Dockerfile?', options: ['Opens a port on the host', 'Documents which ports the container listens on', 'Creates a network', 'Starts the application'], correctIndex: 1 },
    { id: 'q5', question: 'What is a Docker volume?', options: ['A container image layer', 'Persistent data storage for containers', 'A network configuration', 'A container log file'], correctIndex: 1 },
  ],
};

const defaultQuestions: QuizQuestion[] = [
  { id: 'q1', question: 'What is the primary purpose of this technology?', options: ['Data storage', 'Process automation', 'Code execution', 'All of the above'], correctIndex: 3 },
  { id: 'q2', question: 'Which of these is a core concept?', options: ['Abstraction', 'Compilation', 'Interpretation', 'Encapsulation'], correctIndex: 0 },
  { id: 'q3', question: 'What best describes a common use case?', options: ['Web development', 'System administration', 'Data analysis', 'Depends on the technology'], correctIndex: 3 },
  { id: 'q4', question: 'Which practice improves code quality?', options: ['Writing tests', 'Code reviews', 'Documentation', 'All of the above'], correctIndex: 3 },
  { id: 'q5', question: 'What is the most important factor in learning?', options: ['Practice', 'Reading documentation', 'Watching tutorials', 'Building projects'], correctIndex: 3 },
];

export const assessmentService = {
  getQuestions: (skill: string): Promise<QuizQuestion[]> => {
    const questions = questionBank[skill] ?? defaultQuestions;
    return Promise.resolve(questions);
  },

  submitAssessment: async (
    skillId: string,
    skillName: string,
    answers: number[],
  ): Promise<AssessmentResult> => {
    const questions = questionBank[skillName] ?? defaultQuestions;
    const detailed = questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i] ?? -1,
      correct: q.correctIndex,
    }));
    const score = detailed.filter(a => a.selected === a.correct).length;
    const passed = score / questions.length >= 0.7;

    // Persist result to backend
    await studentService.updateSkill(skillId, {
      score: Math.round((score / questions.length) * 100),
      status: passed ? 'Verified' : 'In Progress',
    }).catch(() => { /* non-fatal: result still returned */ });

    return {
      skillId,
      skillName,
      score,
      total: questions.length,
      passed,
      answers: detailed,
    };
  },
};
