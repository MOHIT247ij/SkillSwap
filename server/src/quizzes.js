// Skill verification quizzes. Har skill ke 6 sawaal, quiz mein random 5 aate hain.
// Pass = 4/5 (80%). Answers sirf server pe rehte hain (client ko nahi bheje jaate).
// a = correct option index
export const QUIZZES = {
  Python: [
    { q: 'What is the output of len([1, [2, 3], 4])?', o: ['4', '3', '2', 'Error'], a: 1 },
    { q: 'Which data type is immutable?', o: ['list', 'dict', 'set', 'tuple'], a: 3 },
    { q: 'What does "//" do in Python 3?', o: ['Comment', 'Floor division', 'Exponent', 'Modulo'], a: 1 },
    { q: 'Which keyword defines a function?', o: ['func', 'function', 'def', 'lambda only'], a: 2 },
    { q: 'What is the output of "abc"[::-1]?', o: ['abc', 'cba', 'a', 'Error'], a: 1 },
    { q: 'Which library is mainly used for DataFrames?', o: ['NumPy', 'Pandas', 'Matplotlib', 'Requests'], a: 1 },
  ],
  SQL: [
    { q: 'Which clause filters rows AFTER grouping?', o: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], a: 1 },
    { q: 'Which JOIN returns all rows from the left table?', o: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], a: 1 },
    { q: 'COUNT(column) ignores which values?', o: ['Zeros', 'Duplicates', 'NULLs', 'Negative numbers'], a: 2 },
    { q: 'Which keyword removes duplicate rows in a result?', o: ['UNIQUE', 'DISTINCT', 'DIFFERENT', 'SINGLE'], a: 1 },
    { q: 'Which is a window function?', o: ['ROW_NUMBER()', 'COUNT(*) with GROUP BY only', 'CONCAT()', 'NOW()'], a: 0 },
    { q: 'Correct order of clauses?', o: ['SELECT, WHERE, FROM', 'SELECT, FROM, WHERE, GROUP BY', 'FROM, SELECT, GROUP BY', 'SELECT, GROUP BY, FROM'], a: 1 },
  ],
  JavaScript: [
    { q: 'What is typeof null?', o: ['"null"', '"undefined"', '"object"', '"number"'], a: 2 },
    { q: 'Which declares a block-scoped variable that can be reassigned?', o: ['var', 'let', 'const', 'static'], a: 1 },
    { q: 'What does 2 + "2" give?', o: ['4', '"22"', 'NaN', 'Error'], a: 1 },
    { q: 'Which method creates a new array with transformed items?', o: ['forEach', 'map', 'push', 'find'], a: 1 },
    { q: '=== checks…', o: ['Value only', 'Type only', 'Value and type', 'Reference only for numbers'], a: 2 },
    { q: 'What does an async function always return?', o: ['A callback', 'A Promise', 'undefined', 'An array'], a: 1 },
  ],
  React: [
    { q: 'Which hook stores component state?', o: ['useEffect', 'useState', 'useRef', 'useMemo'], a: 1 },
    { q: 'useEffect with an empty dependency array [] runs…', o: ['On every render', 'Only after the first render', 'Never', 'Only on unmount'], a: 1 },
    { q: 'Data is passed from parent to child using…', o: ['state', 'props', 'context only', 'refs'], a: 1 },
    { q: 'Why do list items need a "key" prop?', o: ['Styling', 'To help React identify items between renders', 'SEO', 'Required by HTML'], a: 1 },
    { q: 'JSX is converted into…', o: ['HTML files', 'React.createElement / JS function calls', 'CSS', 'JSON'], a: 1 },
    { q: 'Which avoids prop drilling for global data?', o: ['useState', 'Context API', 'useRef', 'Fragments'], a: 1 },
  ],
  Excel: [
    { q: 'Which function looks up a value and returns a matching value (modern)?', o: ['XLOOKUP', 'SUMIF', 'CONCAT', 'TRIM'], a: 0 },
    { q: 'What does $A$1 mean?', o: ['Relative reference', 'Absolute reference', 'Named range', 'Error'], a: 1 },
    { q: 'Best tool to summarize large data by category?', o: ['Pivot Table', 'Freeze Panes', 'Spell Check', 'Text to Columns'], a: 0 },
    { q: 'COUNTIF counts cells that…', o: ['Are blank', 'Meet a condition', 'Contain formulas', 'Are numbers only'], a: 1 },
    { q: 'Which removes extra spaces from text?', o: ['CLEAN', 'TRIM', 'LEFT', 'SUBSTITUTE only'], a: 1 },
    { q: 'IFERROR is used to…', o: ['Create errors', 'Return a value when a formula errors', 'Count errors', 'Highlight cells'], a: 1 },
  ],
  'Power BI': [
    { q: 'Which language is used to write measures?', o: ['M', 'DAX', 'SQL', 'Python'], a: 1 },
    { q: 'Power Query is mainly used for…', o: ['Visual formatting', 'Data cleaning & transformation', 'Publishing', 'Row-level security'], a: 1 },
    { q: 'In a star schema, the central table is the…', o: ['Dimension table', 'Fact table', 'Lookup table', 'Calendar table'], a: 1 },
    { q: 'CALCULATE is used to…', o: ['Change filter context of an expression', 'Create a table visual', 'Import data', 'Sort columns'], a: 0 },
    { q: 'Measures vs calculated columns: measures are…', o: ['Stored per row', 'Calculated at query time based on filters', 'Only text', 'Only for dates'], a: 1 },
    { q: 'Which visual is best for trend over time?', o: ['Pie chart', 'Line chart', 'Card', 'Slicer'], a: 1 },
  ],
  Java: [
    { q: 'Which is NOT a primitive type?', o: ['int', 'boolean', 'String', 'char'], a: 2 },
    { q: 'Which keyword is used for inheritance?', o: ['implements', 'extends', 'inherits', 'super'], a: 1 },
    { q: 'Which collection stores key-value pairs?', o: ['ArrayList', 'HashSet', 'HashMap', 'LinkedList'], a: 2 },
    { q: 'Entry point method signature?', o: ['public void main()', 'public static void main(String[] args)', 'static main(String args)', 'void start()'], a: 1 },
    { q: 'Method overloading means…', o: ['Same name, different parameters', 'Same name in child class', 'Private methods', 'Static methods only'], a: 0 },
    { q: 'Which exception occurs on accessing a null reference?', o: ['IOException', 'NullPointerException', 'ArithmeticException', 'ClassNotFoundException'], a: 1 },
  ],
  DSA: [
    { q: 'Time complexity of binary search?', o: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], a: 1 },
    { q: 'Which structure follows LIFO?', o: ['Queue', 'Stack', 'Heap', 'Graph'], a: 1 },
    { q: 'BFS on a graph typically uses a…', o: ['Stack', 'Queue', 'Hash map only', 'Priority queue always'], a: 1 },
    { q: 'Average lookup time in a hash table?', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 0 },
    { q: 'Which sort has O(n log n) worst case?', o: ['Quick sort', 'Merge sort', 'Bubble sort', 'Insertion sort'], a: 1 },
    { q: 'Dynamic programming relies on…', o: ['Random choices', 'Overlapping subproblems + optimal substructure', 'Only recursion without memory', 'Sorting first'], a: 1 },
  ],
};

export const QUIZ_SIZE = 5;
export const PASS_SCORE = 4;

export const findQuizSkill = (skill) =>
  Object.keys(QUIZZES).find((k) => k.toLowerCase() === String(skill || '').toLowerCase()) || null;

// Random 5 questions; options shuffled. Returns public questions + a server-side answer key.
export function buildQuiz(skill) {
  const pool = [...QUIZZES[skill]].sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE);
  return pool.map((item) => {
    const order = item.o.map((_, i) => i).sort(() => Math.random() - 0.5);
    return { q: item.q, o: order.map((i) => item.o[i]), a: order.indexOf(item.a) };
  });
}
