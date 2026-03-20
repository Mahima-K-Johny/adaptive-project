import React, { useEffect, useState, useRef } from 'react';
import {
  BookOpen, LogOut, GraduationCap, FileText, X,
  Download, MessageCircle, Send, Bot, User as UserIcon,
  Sparkles, ExternalLink, CheckCircle, XCircle, AlertTriangle,
  ClipboardCheck, Layers, Clock, Bell, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];
const nextLevel = (l) => LEVEL_ORDER[LEVEL_ORDER.indexOf(l) + 1] || null;
const prevLevel = (l) => LEVEL_ORDER[LEVEL_ORDER.indexOf(l) - 1] || null;
const PASSING_SCORE = 6;

const MCQ_BANK = {
  python: {
    beginner: [
      { q: 'What is the output of: x=[1,2,3]; x.append([4,5]); print(len(x))?', options: ['5','4','2','Error'], answer: 1 },
      { q: 'Which causes an IndentationError?', options: ['Missing colon after if','Mixed tabs and spaces','Undefined variable','Integer division'], answer: 1 },
      { q: 'What does `print(10 // 3)` output?', options: ['3.33','3','4','3.0'], answer: 1 },
      { q: 'What is the result of `bool("") or bool("hello")`?', options: ['False','True','Error','None'], answer: 1 },
      { q: 'What does `range(2, 10, 3)` produce?', options: ['[2,5,8]','[2,4,6,8]','[3,6,9]','[2,5,8,11]'], answer: 0 },
      { q: 'What does `"hello"[::-1]` return?', options: ['hello','olleh','Error','h'], answer: 1 },
      { q: 'What is the output of `print(type(1/2))`?', options: ['int','float','double','number'], answer: 1 },
      { q: 'What does `dict.get("key","default")` return if key is missing?', options: ['None','Error','"default"','False'], answer: 2 },
      { q: 'What is the difference between `is` and `==`?', options: ['No difference','`is` checks identity, `==` checks value','`==` checks identity','Both check memory'], answer: 1 },
      { q: 'What does `*args` allow?', options: ['Keyword args','Variable positional args','Default args','Type hints'], answer: 1 },
    ],
    intermediate: [
      { q: 'What does `functools.lru_cache` do?', options: ['Limits CPU','Caches function results for repeated inputs','Clears memory','Logs calls'], answer: 1 },
      { q: 'Which is true about Python generators?', options: ['Store all values in memory','Use yield and are lazy','Always faster than lists','Require async/await'], answer: 1 },
      { q: 'What does `__slots__` do in a class?', options: ['Enables multithreading','Restricts attributes, reducing memory','Enables operator overloading','Creates abstract methods'], answer: 1 },
      { q: 'What is the GIL?', options: ['Prevents memory leaks','Allows only one thread to execute Python bytecode at a time','Locks global variables','Encrypts global scope'], answer: 1 },
      { q: 'What does `@property` decorator do?', options: ['Makes method static','Allows method to be accessed like an attribute','Prevents subclassing','Creates class method'], answer: 1 },
      { q: 'What is the result of `list(zip([1,2,3],[4,5]))`?', options: ['[(1,4),(2,5),(3,None)]','[(1,4),(2,5)]','Error','[(1,4,3),(5)]'], answer: 1 },
      { q: 'What does `collections.defaultdict(list)` do?', options: ['Returns None for missing keys','Auto-creates empty list for missing keys','Raises KeyError','Converts dict to list'], answer: 1 },
      { q: 'In Python, `*args` vs `**kwargs` — which must come first?', options: ['**kwargs','*args','Either','Named args first'], answer: 1 },
      { q: 'What does `itertools.chain(*iterables)` do?', options: ['Multiplies iterables','Chains multiple iterables into one sequence','Zips iterables','Creates infinite loop'], answer: 1 },
      { q: 'What is the output of `sorted({"b":2,"a":1}.items())`?', options: ["[('a',1),('b',2)]","[('b',2),('a',1)]",'Error','[1,2]'], answer: 0 },
    ],
    advanced: [
      { q: 'What is a metaclass?', options: ['A class without methods','A class that defines how other classes are created','A singleton pattern','A decorator factory'], answer: 1 },
      { q: 'What does `__enter__` and `__exit__` enable?', options: ['Operator overloading','Context manager protocol','Coroutine support','Descriptor protocol'], answer: 1 },
      { q: 'What is the MRO algorithm Python uses?', options: ['Depth First','Breadth First','C3 Linearization','Round Robin'], answer: 2 },
      { q: 'What does `asyncio.gather()` do?', options: ['Runs coroutines sequentially','Runs multiple coroutines concurrently','Creates thread pool','Blocks event loop'], answer: 1 },
      { q: 'What does `__new__` do vs `__init__`?', options: ['Identical','__new__ creates instance, __init__ initializes it','__init__ creates','__new__ only for metaclasses'], answer: 1 },
    ],
  },
  javascript: {
    beginner: [
      { q: 'What is the output of `typeof null`?', options: ['"null"','"object"','"undefined"','"boolean"'], answer: 1 },
      { q: 'What does `===` check that `==` does NOT?', options: ['Value only','Both type and value','Reference','Prototype'], answer: 1 },
      { q: 'Which is a falsy value in JS?', options: ['"false"','[]','0','{}'], answer: 2 },
      { q: 'What is the result of `"5" - 3`?', options: ['Error','"53"','2','"5-3"'], answer: 2 },
      { q: 'Which method does NOT modify the original array?', options: ['splice()','sort()','map()','push()'], answer: 2 },
      { q: 'What is a closure?', options: ['A class with private fields','A function retaining access to outer scope variables','An IIFE','A callback'], answer: 1 },
      { q: 'What is event bubbling?', options: ['Events trigger parent handlers after child handlers','Events trigger only on target','Events propagate parent to child','Events queue in microtask queue'], answer: 0 },
      { q: 'What does `void` operator return?', options: ['0','null','undefined','false'], answer: 2 },
      { q: 'What does `Array.from({length:3},(_,i)=>i)` return?', options: ['[1,2,3]','[0,1,2]','[undefined×3]','Error'], answer: 1 },
      { q: '`const arr=[1,2]; arr.push(3);` — error?', options: ['Yes','No, const prevents reassignment not mutation','Yes arrays are frozen','Only in strict mode'], answer: 1 },
    ],
    intermediate: [
      { q: 'Output of: `console.log(1 + "2" + 3)`?', options: ['6','"123"','"15"','123'], answer: 1 },
      { q: 'What is the Temporal Dead Zone (TDZ)?', options: ['Time before setTimeout','Period where let/const exist but cannot be accessed','Unused memory','Async gap'], answer: 1 },
      { q: 'What does `Object.freeze()` prevent?', options: ['Prototype modification','Property addition, deletion, and modification','Deep nested changes','Garbage collection'], answer: 1 },
      { q: 'What is microtask queue priority vs macrotask?', options: ['Equal','Microtasks after macrotasks','Microtasks before macrotasks','Browser-dependent'], answer: 2 },
      { q: 'What does `WeakMap` do that `Map` does not?', options: ['Allows primitive keys','Holds weak references allowing GC of keys','Supports iteration','Preserves insertion order'], answer: 1 },
      { q: '`Promise.allSettled()` vs `Promise.all()`?', options: ['Faster','Waits for all regardless of rejection','Only handles fulfilled','Sequential'], answer: 1 },
      { q: 'What does `Symbol.iterator` enable?', options: ['Symbol comparison','Custom iteration with for...of','Unique object keys','Prototype chaining'], answer: 1 },
      { q: 'Output of `async function f(){return 1}; console.log(f())`?', options: ['1','Promise {<fulfilled>: 1}','undefined','Error'], answer: 1 },
      { q: 'What is tail call optimization?', options: ['Optimizing last loop','Reusing stack frame for tail-position recursive calls','Lazy evaluation','Tree shaking'], answer: 1 },
      { q: 'What does the Proxy object enable?', options: ['HTTP proxying','Intercepting and redefining object operations','Prototype manipulation','Memory pooling'], answer: 1 },
    ],
    advanced: [
      { q: '`[[Prototype]]` vs `prototype` property?', options: ['Same','[[Prototype]] is internal; prototype is on constructor functions','prototype deprecated','[[Prototype]] only for classes'], answer: 1 },
      { q: 'What does the Proxy object enable?', options: ['HTTP proxying','Intercepting and redefining object operations','Prototype manipulation','Memory pooling'], answer: 1 },
      { q: 'What is tail call optimization?', options: ['Optimizing last loop','Reusing stack frame for tail-position recursive calls','Lazy evaluation','Tree shaking'], answer: 1 },
    ],
  },
  dsa: {
    beginner: [
      { q: 'Worst-case time complexity of QuickSort?', options: ['O(n log n)','O(n²)','O(n)','O(log n)'], answer: 1 },
      { q: 'Where is max element stored in Max-Heap?', options: ['Last node','Middle node','Root node','Left-most leaf'], answer: 2 },
      { q: 'Space complexity of recursive Fibonacci without memoization?', options: ['O(1)','O(n)','O(n²)','O(2^n)'], answer: 1 },
      { q: 'Which data structure is used in BFS traversal?', options: ['Stack','Queue','Heap','Array'], answer: 1 },
      { q: 'Time complexity to access kth element in singly linked list?', options: ['O(1)','O(log k)','O(k)','O(n²)'], answer: 2 },
      { q: 'What distinguishes Graph from Tree?', options: ['Trees have weights','Graphs can have cycles, trees cannot','Trees are directed','Graphs have no leaves'], answer: 1 },
      { q: 'Height of complete binary tree with n nodes?', options: ['O(n)','O(log n)','O(n log n)','O(√n)'], answer: 1 },
      { q: "What problem does Kadane's algorithm solve?", options: ['Shortest path','Maximum subarray sum','Topological sort','MST'], answer: 1 },
      { q: 'What does amortized O(1) mean for dynamic array append?', options: ['Every append O(1)','Average O(1) over many operations','Never triggers resize','Only first append O(1)'], answer: 1 },
      { q: 'What is hash collision?', options: ['Two keys→same index; chaining stores multiple items','Overflow; backup array','Duplicate value; delete','Memory error'], answer: 0 },
    ],
    intermediate: [
      { q: 'Dijkstra vs Bellman-Ford?', options: ['Dijkstra slower','Dijkstra no negative weights; Bellman-Ford handles them','Bellman-Ford cannot find shortest','Identical'], answer: 1 },
      { q: 'Time complexity of building a heap from n elements?', options: ['O(n log n)','O(n)','O(log n)','O(n²)'], answer: 1 },
      { q: 'What does a Trie optimize over HashMap for strings?', options: ['Insertion speed','Prefix search in O(m)','Memory','Deletion'], answer: 1 },
      { q: 'What is "optimal substructure" in DP?', options: ['Overlapping subproblems','Optimal solution built from optimal subproblem solutions','A greedy property','Dividing into equal halves'], answer: 1 },
      { q: 'DFS vs BFS for shortest path?', options: ['DFS always finds it','BFS finds shortest in unweighted; DFS does not guarantee','Both equivalent','Neither finds it'], answer: 1 },
      { q: 'Time complexity of AVL tree insertion?', options: ['O(n)','O(log n)','O(1)','O(n log n)'], answer: 1 },
      { q: 'What does Floyd-Warshall solve?', options: ['Single-source shortest','All-pairs shortest path','MST','Topological sort'], answer: 1 },
      { q: 'Key insight of sliding window technique?', options: ['Two pointers moving forward to avoid redundant computation','Sort then search','Divide recursively','Use stack for window'], answer: 0 },
      { q: 'What does NP-Complete mean?', options: ['Cannot be solved','In NP and every NP problem reduces to it','Runs in O(n!)','Exponential space'], answer: 1 },
      { q: 'Red-Black Tree vs AVL Tree?', options: ['Red-Black always shorter','Red-Black faster insertions; AVL faster lookups','AVL supports more types','Identical'], answer: 1 },
    ],
    advanced: [
      { q: 'What does NP-Complete mean?', options: ['Cannot be solved','In NP and every NP problem reduces to it in polynomial time','Runs in O(n!)','Exponential space'], answer: 1 },
      { q: 'Amortized complexity of union-find with path compression + union by rank?', options: ['O(log n)','O(n)','O(α(n)) — nearly O(1)','O(n log n)'], answer: 2 },
      { q: 'Red-Black Tree vs AVL Tree?', options: ['Red-Black always shorter','Red-Black faster insertions; AVL faster lookups','AVL supports more types','Identical'], answer: 1 },
    ],
  },
  'machine learning': {
    beginner: [
      { q: 'Supervised vs unsupervised learning?', options: ['No difference','Supervised uses labeled data; unsupervised finds patterns without labels','Unsupervised more accurate','Supervised only for images'], answer: 1 },
      { q: 'What does overfitting mean?', options: ['Too simple model','Good on training data but poor on unseen data','Trains too slowly','Too much memory'], answer: 1 },
      { q: 'What is gradient descent minimizing?', options: ['Model complexity','The loss function','Training time','Number of features'], answer: 1 },
      { q: 'What does a confusion matrix show?', options: ['Model architecture','TP, FP, TN, FN for classification','Training loss curve','Feature importance'], answer: 1 },
      { q: 'Purpose of L1/L2 regularization?', options: ['Speed up training','Penalize large weights to reduce overfitting','Increase capacity','Normalize input'], answer: 1 },
      { q: 'What does `precision` measure?', options: ['% actual positives correctly identified','% predicted positives that are actually positive','Total accuracy','F1 component only'], answer: 1 },
      { q: 'Purpose of cross-validation?', options: ['Faster inference','More reliable performance estimation using multiple splits','Data augmentation','Hyperparameter init'], answer: 1 },
      { q: 'Vanishing gradient problem?', options: ['Gradients too large','Gradients too small in deep networks','Non-differentiable loss','Overfitting'], answer: 1 },
      { q: 'What is the curse of dimensionality?', options: ['Too many classes','As dimensions increase, data sparse and distances lose meaning','Too many examples','GPU limitation'], answer: 1 },
      { q: 'Purpose of train/validation/test split?', options: ['Speed up training','Train to fit; validation for hyperparameters; test for final evaluation','Reduce dataset','Balance classes'], answer: 1 },
    ],
    intermediate: [
      { q: 'Bagging vs boosting?', options: ['Same','Bagging parallel independent; boosting sequential correcting errors','Boosting always better','Bagging only for trees'], answer: 1 },
      { q: 'Kernel trick in SVM?', options: ['Faster linear separation','Implicitly maps to higher dimensions without explicit computation','Regularization','Feature selection'], answer: 1 },
      { q: 'Attention mechanism in transformers?', options: ['Filters inputs','Weighted relevance between all tokens for context-aware representations','Type of pooling','Dropout alternative'], answer: 1 },
      { q: 'What does batch normalization solve?', options: ['Overfitting','Internal covariate shift — normalizing layer inputs to stabilize training','Vanishing gradients only','Class imbalance'], answer: 1 },
      { q: 'VAE vs GAN?', options: ['Same','VAE learns latent distribution; GAN uses adversarial training','GANs stable training','VAEs produce sharper images'], answer: 1 },
      { q: 'Generative vs discriminative models?', options: ['No difference','Generative learns P(X|Y); discriminative learns P(Y|X) directly','Discriminative can generate','Generative always supervised'], answer: 1 },
      { q: 'What does RLHF solve in LLMs?', options: ['Reduces size','Aligns outputs with human preferences through reward modeling','Speeds inference','Reduces hallucinations only'], answer: 1 },
      { q: '"No free lunch" theorem?', options: ['All models equal on average across all problems','Some algorithms always outperform','DL always wins','Simple models always better'], answer: 0 },
      { q: 'Bagging vs boosting?', options: ['Same','Bagging parallel independent; boosting sequential correcting errors','Boosting always better','Bagging only for trees'], answer: 1 },
      { q: 'Kernel trick in SVM?', options: ['Faster linear separation','Implicitly maps to higher dimensions without explicit computation','Regularization','Feature selection'], answer: 1 },
    ],
    advanced: [
      { q: 'VAE vs GAN?', options: ['Same','VAE learns latent distribution with reconstruction loss; GAN uses adversarial training','GANs stable','VAEs produce sharper images'], answer: 1 },
      { q: 'What does RLHF solve in LLMs?', options: ['Reduces size','Aligns outputs with human preferences through reward modeling','Speeds inference','Reduces hallucinations only'], answer: 1 },
      { q: '"No free lunch" theorem?', options: ['All models equal on average across all problems','Some algorithms always outperform','DL always wins','Simple models always better'], answer: 0 },
    ],
  },
};

const FALLBACK_MCQ = [
  { q: 'What is time complexity?', options: ['CPU speed','How runtime scales as input grows','Memory usage','Code readability'], answer: 1 },
  { q: 'Stack memory vs heap memory?', options: ['No difference','Stack for call frames; heap for dynamic allocation','Heap faster','Stack larger'], answer: 1 },
  { q: 'What is a race condition?', options: ['Slow network','Outcome depends on unpredictable thread execution','CPU overheating','Memory overflow'], answer: 1 },
  { q: 'Synchronous vs asynchronous?', options: ['No difference','Sync blocks until complete; async continues without waiting','Async always parallel','Sync multi-threaded'], answer: 1 },
  { q: 'SQL vs NoSQL?', options: ['NoSQL always faster','SQL structured schemas/relations; NoSQL flexible','SQL cannot scale','NoSQL cannot query'], answer: 1 },
  { q: 'What is a deadlock?', options: ['System crash','Circular waiting where processes hold resources needed by others','CPU bottleneck','Memory fragmentation'], answer: 1 },
  { q: 'What is the CAP theorem?', options: ['CPU, Availability, Performance','Consistency, Availability, Partition tolerance — 2 of 3','Caching, API, Processing','A network protocol'], answer: 1 },
  { q: 'Unit vs integration vs E2E testing?', options: ['All test same','Unit tests functions; integration tests modules; E2E tests workflows','Unit slowest','E2E most granular'], answer: 1 },
  { q: 'What is a memory leak?', options: ['Slow program','Memory allocated but never freed','Segfault','Stack overflow'], answer: 1 },
  { q: 'REST key constraint?', options: ['Remote Execution; speed','Representational State Transfer; statelessness','Request-Response; caching','Reliable End State; security'], answer: 1 },
];

const COURSE_RECOMMENDATIONS = {
  python: {
    beginner:     [{ title: 'Python for Everybody', platform: 'Coursera', instructor: 'University of Michigan', rating: '4.8', students: '2M+', link: 'https://www.coursera.org/specializations/python', price: 'Free', duration: '8 months' }],
    intermediate: [{ title: '100 Days of Code: Python', platform: 'Udemy', instructor: 'Dr. Angela Yu', rating: '4.7', students: '800K+', link: 'https://www.udemy.com/course/100-days-of-code/', price: '₹499', duration: '60 hours' }],
    advanced:     [{ title: 'Advanced Python Mastery', platform: 'LinkedIn Learning', instructor: 'Joe Marini', rating: '4.7', students: '200K+', link: 'https://www.linkedin.com/learning/advanced-python', price: 'Premium', duration: '2 hours' }],
  },
  javascript: {
    beginner:     [{ title: 'JavaScript Tutorial', platform: 'YouTube', instructor: 'Programming with Mosh', rating: '4.9', students: '5M+', link: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', price: 'Free', duration: '1 hour' }],
    intermediate: [{ title: 'Complete JavaScript Course', platform: 'Udemy', instructor: 'Jonas Schmedtmann', rating: '4.7', students: '700K+', link: 'https://www.udemy.com/course/the-complete-javascript-course/', price: '₹499', duration: '69 hours' }],
    advanced:     [{ title: 'Advanced JavaScript Concepts', platform: 'Udemy', instructor: 'Andrei Neagoie', rating: '4.7', students: '100K+', link: 'https://www.udemy.com/course/advanced-javascript-concepts/', price: '₹499', duration: '25 hours' }],
  },
  react: {
    beginner:     [{ title: 'React Tutorial for Beginners', platform: 'YouTube', instructor: 'Programming with Mosh', rating: '4.9', students: '2M+', link: 'https://www.youtube.com/watch?v=SqcY0GlETPk', price: 'Free', duration: '2.5 hours' }],
    intermediate: [{ title: 'React - The Complete Guide', platform: 'Udemy', instructor: 'Maximilian Schwarzmüller', rating: '4.6', students: '500K+', link: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', price: '₹499', duration: '48 hours' }],
    advanced:     [{ title: 'Advanced React Patterns', platform: 'Frontend Masters', instructor: 'Kent C. Dodds', rating: '4.8', students: '50K+', link: 'https://frontendmasters.com/courses/advanced-react-patterns/', price: '$39/month', duration: '8 hours' }],
  },
  dsa: {
    beginner:     [{ title: 'DSA for Beginners', platform: 'YouTube', instructor: 'Abdul Bari', rating: '4.9', students: '2M+', link: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O', price: 'Free', duration: '50 hours' }],
    intermediate: [{ title: 'Mastering DSA', platform: 'Udemy', instructor: 'Abdul Bari', rating: '4.7', students: '400K+', link: 'https://www.udemy.com/course/datastructurescncpp/', price: '₹499', duration: '58 hours' }],
    advanced:     [{ title: 'Advanced Algorithms', platform: 'MIT OpenCourseWare', instructor: 'MIT', rating: '4.9', students: '100K+', link: 'https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/', price: 'Free', duration: 'Self-paced' }],
  },
  'machine learning': {
    beginner:     [{ title: 'Machine Learning Specialization', platform: 'Coursera', instructor: 'Andrew Ng', rating: '4.9', students: '5M+', link: 'https://www.coursera.org/specializations/machine-learning-introduction', price: 'Free', duration: '3 months' }],
    intermediate: [{ title: 'Machine Learning A-Z', platform: 'Udemy', instructor: 'Kirill Eremenko', rating: '4.5', students: '900K+', link: 'https://www.udemy.com/course/machinelearning/', price: '₹499', duration: '44 hours' }],
    advanced:     [{ title: 'Deep Learning Specialization', platform: 'Coursera', instructor: 'Andrew Ng', rating: '4.9', students: '1M+', link: 'https://www.coursera.org/specializations/deep-learning', price: 'Free', duration: '5 months' }],
  },
};

const INITIAL_CHAT_STATE = {
  phase: 'idle', subject: null, requestedLevel: null,
  mcqQuestions: [], currentQuestion: 0, correctAnswers: 0,
  lastScore: null, lastTestedLevel: null, wantedLevelAfterResult: null,
};

const makeInitialMessages = () => [{
  role: 'assistant',
  content: { type: 'text', message: `Hi! 👋 I'm your AI Study Assistant.\n\nTell me a subject — I'll quiz you to find your level and recommend the perfect courses!` },
  timestamp: new Date(),
}];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem('studentEmail');
  const studentName = email ? email.split('@')[0] : 'Student';
  const displayName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

  const [notes, setNotes]               = useState([]);
  const [showNotes, setShowNotes]       = useState(false);
  const [time, setTime]                 = useState(new Date());
  const [showChatbot, setShowChatbot]   = useState(false);
  const [messages, setMessages]         = useState(makeInitialMessages());
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [chatState, setChatState]       = useState(INITIAL_CHAT_STATE);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchNotes();
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchNotes = async () => {
    try { const r = await axios.get('http://localhost:5000/api/materials/all'); setNotes(r.data || []); }
    catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentLoggedIn');
    localStorage.removeItem('studentEmail');
    navigate('/student-login');
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
    setTimeout(() => { setMessages(makeInitialMessages()); setChatState(INITIAL_CHAT_STATE); setInputMessage(''); }, 300);
  };

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const addMsg = (role, content) => setMessages(p => [...p, { role, content, timestamp: new Date() }]);

  const detectSubject = (text) => {
    const t = text.toLowerCase();
    const map = {
      react: ['react','reactjs'], javascript: ['javascript','js','es6'],
      python: ['python','py'], java: ['java'],
      'web development': ['web dev','web development','frontend','backend','html','css'],
      dsa: ['dsa','data structures','algorithms'],
      'machine learning': ['ml','machine learning','ai'],
    };
    for (const [s, kws] of Object.entries(map)) if (kws.some(k => t.includes(k))) return s;
    return null;
  };

  const detectLevel = (text) => {
    const t = text.toLowerCase();
    if (['beginner','basic','start','new','zero','scratch'].some(k => t.includes(k))) return 'beginner';
    if (['intermediate','medium','middle','moderate'].some(k => t.includes(k))) return 'intermediate';
    if (['advanced','expert','pro','master','senior'].some(k => t.includes(k))) return 'advanced';
    return null;
  };

  const detectYesNo = (text) => {
    const t = text.toLowerCase();
    if (['yes','yeah','yep','ok','okay','sure','agree'].some(k => t.includes(k))) return 'yes';
    if (['no','nope','nah','not','refuse','still want','insist'].some(k => t.includes(k))) return 'no';
    return null;
  };

  const getMCQs = (subject, level) => {
    const bank = MCQ_BANK[subject]?.[level] || FALLBACK_MCQ;
    return [...bank].sort(() => Math.random() - 0.5).slice(0, 10);
  };

  const buildMCQ = (qs, idx) => ({ question: qs[idx].q, options: qs[idx].options, questionNum: idx + 1, total: qs.length });

  const evaluateScore = (score, total, level, subject) => {
    const pct = Math.round((score / total) * 100);
    const upper = nextLevel(level); const lower = prevLevel(level);
    if (score > 8 && upper) return { verdict: 'upgrade', suggestedLevel: upper, score, total, pct, msg: `🎉 Outstanding! **${score}/${total} (${pct}%)** on **${level}**!\n\nYou've mastered this level. Recommend **${upper}** courses.\n\nWould you like **${upper}** (recommended) or stay at **${level}**?` };
    if (score < PASSING_SCORE && lower) return { verdict: 'downgrade', suggestedLevel: lower, score, total, pct, msg: `📊 You scored **${score}/${total} (${pct}%)** on **${level}**.\n\nStarting at **${lower}** will build your foundation.\n\nWould you like **${lower}** (recommended) or push with **${level}**?` };
    return { verdict: 'same', suggestedLevel: level, score, total, pct, msg: `✅ **${score}/${total} (${pct}%)** — solid for **${level}** level **${subject}**!` };
  };

  const processMsg = async (text, optIdx = null, snap = null) => {
    const t = text.toLowerCase().trim();
    const st = snap !== null ? snap : chatState;

    if (st.phase === 'idle') {
      const subj = detectSubject(text);
      if (!subj) return simpleReply(t);
      setChatState({ ...INITIAL_CHAT_STATE, phase: 'askLevel', subject: subj });
      return { type: 'text', message: `You want to learn **${subj}**! 🎯\n\nYour level:\n🟢 **Beginner**\n🟡 **Intermediate**\n🔴 **Advanced**` };
    }
    if (st.phase === 'askLevel') {
      const level = detectLevel(text);
      if (!level) return { type: 'text', message: `Please choose: **Beginner**, **Intermediate**, or **Advanced**.` };
      const qs = getMCQs(st.subject, level);
      setChatState({ ...st, phase: 'runningMCQ', requestedLevel: level, mcqQuestions: qs, currentQuestion: 0, correctAnswers: 0 });
      return { type: 'text', message: `🧠 Assessing **${level}** knowledge in **${st.subject}**!\n\n10 questions — be honest!`, followUp: { type: 'mcq', ...buildMCQ(qs, 0) } };
    }
    if (st.phase === 'runningMCQ') {
      if (optIdx === null) return { type: 'text', message: `👆 Click an answer!` };
      const q = st.mcqQuestions[st.currentQuestion];
      const correct = optIdx === q.answer;
      const newScore = st.correctAnswers + (correct ? 1 : 0);
      const nextQ = st.currentQuestion + 1;
      const fb = { type: 'mcq_feedback', correct, correctAnswer: q.options[q.answer], questionNum: st.currentQuestion + 1, total: st.mcqQuestions.length };
      if (nextQ < st.mcqQuestions.length) {
        setChatState({ ...st, currentQuestion: nextQ, correctAnswers: newScore });
        return { type: 'mcq_feedback_with_next', ...fb, followUp: { type: 'mcq', ...buildMCQ(st.mcqQuestions, nextQ) } };
      }
      const result = evaluateScore(newScore, st.mcqQuestions.length, st.requestedLevel, st.subject);
      if (result.verdict === 'same') {
        setChatState({ ...st, phase: 'showCourses', lastScore: newScore, lastTestedLevel: st.requestedLevel, correctAnswers: newScore });
        return { type: 'mcq_result_with_courses', score: result.score, total: result.total, pct: result.pct, message: result.msg, subject: st.subject, level: result.suggestedLevel, courses: COURSE_RECOMMENDATIONS[st.subject]?.[result.suggestedLevel] || [] };
      }
      setChatState({ ...st, phase: 'awaitingLevelChoice', lastScore: newScore, lastTestedLevel: st.requestedLevel, wantedLevelAfterResult: result.suggestedLevel, correctAnswers: newScore });
      return { type: 'mcq_result_level_choice', score: result.score, total: result.total, pct: result.pct, verdict: result.verdict, message: result.msg, suggestedLevel: result.suggestedLevel, requestedLevel: st.requestedLevel, subject: st.subject };
    }
    if (st.phase === 'awaitingLevelChoice') {
      const yn = detectYesNo(text); const explicit = detectLevel(text);
      let chosen = explicit;
      if (!chosen && (yn === 'yes' || t.includes(st.wantedLevelAfterResult))) chosen = st.wantedLevelAfterResult;
      if (!chosen && (yn === 'no' || t.includes(st.lastTestedLevel) || t.includes('still'))) chosen = st.lastTestedLevel;
      if (!chosen) return { type: 'text', message: `Which: **${st.wantedLevelAfterResult}** (recommended) or **${st.lastTestedLevel}** (your choice)?` };
      if (LEVEL_ORDER.indexOf(chosen) > LEVEL_ORDER.indexOf(st.lastTestedLevel) && st.lastScore < PASSING_SCORE) {
        setChatState({ ...st, phase: 'awaitingEnforceConfirm', wantedLevelAfterResult: chosen });
        return { type: 'mcq_enforce_warning', message: `⚠️ You scored **${st.lastScore}/10** on **${st.lastTestedLevel}** — below passing threshold.\n\n• **${st.lastTestedLevel}** (safe, recommended)\n• **${chosen}** (risky)`, warningLevel: chosen, safeLevel: st.lastTestedLevel };
      }
      setChatState({ ...st, phase: 'showCourses' });
      return { type: 'course_recommendation', message: `**${chosen}** level **${st.subject}** courses 📚`, courses: COURSE_RECOMMENDATIONS[st.subject]?.[chosen] || [] };
    }
    if (st.phase === 'awaitingEnforceConfirm') {
      const yn = detectYesNo(text); const explicit = detectLevel(text);
      let chosen = explicit;
      if (!chosen && (t.includes(st.lastTestedLevel) || t.includes('safe') || yn === 'no')) chosen = st.lastTestedLevel;
      if (!chosen && (t.includes('sure') || t.includes('anyway') || t.includes(st.wantedLevelAfterResult) || yn === 'yes')) chosen = st.wantedLevelAfterResult;
      if (!chosen) return { type: 'text', message: `**${st.lastTestedLevel}** (recommended) or **${st.wantedLevelAfterResult}** (insist)?` };
      setChatState({ ...st, phase: 'showCourses' });
      return { type: 'course_recommendation', message: chosen === st.lastTestedLevel ? `Great choice! **${chosen}** courses 🎯` : `**${chosen}** courses — good luck! 💪`, courses: COURSE_RECOMMENDATIONS[st.subject]?.[chosen] || [] };
    }
    if (st.phase === 'showCourses') {
      const subj = detectSubject(text);
      if (subj) { setChatState({ ...INITIAL_CHAT_STATE, phase: 'askLevel', subject: subj }); return { type: 'text', message: `Let's explore **${subj}**!\n\n🟢 Beginner  🟡 Intermediate  🔴 Advanced` }; }
      const lv = detectLevel(text);
      if (lv) return { type: 'course_recommendation', message: `**${lv}** level **${st.subject}** courses 📚`, courses: COURSE_RECOMMENDATIONS[st.subject]?.[lv] || [] };
      return { type: 'text', message: `Want a different level or subject? Just tell me! 😊` };
    }
    return simpleReply(t);
  };

  const simpleReply = (t) => {
    if (t.match(/^(hi|hello|hey|hii)$/)) return { type: 'text', message: `Hi! 👋 What subject do you want to learn?` };
    if (t.includes('thank')) return { type: 'text', message: `You're welcome! 😊` };
    return { type: 'text', message: `Tell me a subject — Python, React, DSA, Java, ML, JavaScript... 📚` };
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim(); setInputMessage('');
    addMsg('user', { type: 'text', message: text }); setIsTyping(true);
    const snap = chatState;
    setTimeout(async () => {
      const res = await processMsg(text, null, snap);
      if (res.followUp) { addMsg('assistant', res); setTimeout(() => addMsg('assistant', res.followUp), 700); }
      else addMsg('assistant', res);
      setIsTyping(false);
    }, 800);
  };

  const handleMCQ = async (optIdx, optText) => {
    addMsg('user', { type: 'text', message: optText }); setIsTyping(true);
    const snap = chatState;
    setTimeout(async () => {
      const res = await processMsg(optText, optIdx, snap);
      if (res.type === 'mcq_feedback_with_next') {
        addMsg('assistant', { type: 'mcq_feedback', correct: res.correct, correctAnswer: res.correctAnswer, questionNum: res.questionNum, total: res.total });
        setTimeout(() => addMsg('assistant', res.followUp), 800);
      } else if (res.followUp) { addMsg('assistant', res); setTimeout(() => addMsg('assistant', res.followUp), 700); }
      else addMsg('assistant', res);
      setIsTyping(false);
    }, 500);
  };

  const handleChoice = async (choice) => {
    addMsg('user', { type: 'text', message: choice }); setIsTyping(true);
    const snap = chatState;
    setTimeout(async () => { const res = await processMsg(choice, null, snap); addMsg('assistant', res); setIsTyping(false); }, 600);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const bold = (s) => s ? s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : '';

  const renderContent = (content) => {
    if (typeof content === 'string') return <p>{content}</p>;
    switch (content.type) {
      case 'text':
        return <p style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: bold(content.message) }} />;
      case 'mcq':
        return (
          <div className="sd-mcq-block">
            <div className="sd-mcq-header">
              <span className="sd-mcq-progress">Q{content.questionNum}/{content.total}</span>
              <span className="sd-mcq-badge">⚡ Hard</span>
            </div>
            <div className="sd-mcq-bar"><div className="sd-mcq-fill" style={{ width: `${(content.questionNum / content.total) * 100}%` }} /></div>
            <p className="sd-mcq-question">{content.question}</p>
            <div className="sd-mcq-options">
              {content.options.map((opt, i) => (
                <button key={i} className="sd-mcq-opt" onClick={() => handleMCQ(i, opt)}>
                  <span className="sd-mcq-letter">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 'mcq_feedback':
        return (
          <div className={`sd-feedback ${content.correct ? 'correct' : 'incorrect'}`}>
            {content.correct ? <><CheckCircle size={15} /><span>Correct! ✨</span></> : <><XCircle size={15} /><span>Wrong. Answer: <strong>{content.correctAnswer}</strong></span></>}
          </div>
        );
      case 'mcq_result_with_courses': {
        const cls = content.pct >= 70 ? 'high' : content.pct >= 50 ? 'mid' : 'low';
        return (
          <div>
            <div className={`sd-score-circle ${cls}`}><span>{content.score}/{content.total}</span><small>{content.pct}%</small></div>
            <p style={{ marginTop:'0.7rem', whiteSpace:'pre-line', fontSize:'0.84rem' }} dangerouslySetInnerHTML={{ __html: bold(content.message) }} />
            <div className="sd-courses">{content.courses.map((c, i) => renderCourse(c, i))}</div>
          </div>
        );
      }
      case 'mcq_result_level_choice': {
        const cls = content.pct >= 70 ? 'high' : content.pct >= 50 ? 'mid' : 'low';
        return (
          <div>
            <div className={`sd-score-circle ${cls}`}><span>{content.score}/{content.total}</span><small>{content.pct}%</small></div>
            <p style={{ marginTop:'0.7rem', whiteSpace:'pre-line', fontSize:'0.84rem' }} dangerouslySetInnerHTML={{ __html: bold(content.message) }} />
            <div className="sd-upgrade-opts">
              <button className="sd-upgrade-btn primary" onClick={() => handleChoice(`I want ${content.suggestedLevel} courses`)}>{content.verdict==='upgrade'?'🚀':'📖'} {content.suggestedLevel} (recommended)</button>
              <button className="sd-upgrade-btn secondary" onClick={() => handleChoice(`I still want ${content.requestedLevel} courses`)}>{content.requestedLevel} (my choice)</button>
            </div>
          </div>
        );
      }
      case 'mcq_enforce_warning':
        return (
          <div className="sd-warning">
            <div className="sd-warning-row"><AlertTriangle size={18} color="#f5c542" /><span className="sd-warning-title">Knowledge Gap</span></div>
            <p style={{ whiteSpace:'pre-line', fontSize:'0.82rem', marginTop:'0.5rem' }} dangerouslySetInnerHTML={{ __html: bold(content.message) }} />
            <div className="sd-upgrade-opts">
              <button className="sd-upgrade-btn primary" onClick={() => handleChoice(`I want ${content.safeLevel} courses`)}>📖 {content.safeLevel} (recommended)</button>
              <button className="sd-upgrade-btn secondary" onClick={() => handleChoice(`I insist on ${content.warningLevel} courses`)}>⚠️ {content.warningLevel} (insist)</button>
            </div>
          </div>
        );
      case 'course_recommendation':
        return (
          <div>
            <p style={{ fontWeight:600, fontSize:'0.84rem', marginBottom:'0.6rem' }} dangerouslySetInnerHTML={{ __html: bold(content.message) }} />
            <div className="sd-courses">{content.courses.map((c, i) => renderCourse(c, i))}</div>
          </div>
        );
      default: return null;
    }
  };

  const renderCourse = (course, idx) => (
    <div key={idx} className="sd-course-card">
      <div className="sd-course-top"><h4>{course.title}</h4><span className="sd-course-platform">{course.platform}</span></div>
      <p className="sd-course-instructor">👨‍🏫 {course.instructor}</p>
      <div className="sd-course-stats">
        <span>⭐ {course.rating}</span><span>👥 {course.students}</span>
        <span className="sd-course-price">{course.price}</span>
        {course.duration && <span>⏱️ {course.duration}</span>}
      </div>
      <a href={course.link} target="_blank" rel="noopener noreferrer" className="sd-course-link">View Course <ExternalLink size={11} /></a>
    </div>
  );

  const quickActions = ['Learn Python', 'React for beginners', 'Advanced DSA', 'Java programming', 'Machine Learning'];

  return (
    <div className="sd-root">

      {/* ── SIDEBAR ── */}
      <aside className="sd-sidebar">
        <div className="sd-sidebar-logo">
          <div className="sd-logo-mark"><GraduationCap size={20} /></div>
          <span className="sd-logo-text">EduAdapt</span>
        </div>

        <div className="sd-sidebar-avatar">
          <div className="sd-avatar-ring"><span className="sd-avatar-letter">{displayName.charAt(0)}</span></div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">{displayName}</p>
            <p className="sd-avatar-role">Student</p>
          </div>
        </div>

        <nav className="sd-sidebar-nav">
          <button className="sd-nav-item sd-nav-active"><Layers size={16} /><span>Dashboard</span></button>
          <button className="sd-nav-item" onClick={() => navigate('/topics')}><BookOpen size={16} /><span>Courses</span></button>
          <button className="sd-nav-item" onClick={() => setShowNotes(true)}>
            <FileText size={16} /><span>Study Materials</span>
            {notes.length > 0 && <span className="sd-nav-badge">{notes.length}</span>}
          </button>
          <button className="sd-nav-item" onClick={() => navigate('/student-exam')}><ClipboardCheck size={16} /><span>Take Exam</span></button>
          {/* ✅ NEW — My Progress nav item */}
          <button className="sd-nav-item" onClick={() => navigate('/student-progress')}><TrendingUp size={16} /><span>My Progress</span></button>
          <button className="sd-nav-item" onClick={() => setShowChatbot(true)}><MessageCircle size={16} /><span>AI Assistant</span></button>
        </nav>

        <button className="sd-sidebar-logout" onClick={handleLogout}><LogOut size={15} /><span>Logout</span></button>
      </aside>

      {/* ── MAIN ── */}
      <main className="sd-main">
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <div className="sd-clock"><Clock size={13} /><span>{time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span></div>
          </div>
          <div className="sd-topbar-right">
            <Bell size={16} className="sd-bell" />
            <span className="sd-topbar-email">{email}</span>
          </div>
        </header>

        {/* Hero */}
        <section className="sd-hero">
          <div className="sd-hero-shape" aria-hidden="true" />
          <p className="sd-hero-greeting">{greeting()},</p>
          <h1 className="sd-hero-name">{displayName} <span>👋</span></h1>
          <p className="sd-hero-sub">Ready to learn something new today?</p>
        </section>

        {/* ✅ 4 Cards — Topics, Materials, Exam, Progress */}
        <section className="sd-cards">
          <div className="sd-card" onClick={() => navigate('/topics')}>
            <div className="sd-card-accent" />
            <div className="sd-card-body">
              <div className="sd-card-icon-wrap sd-ci-blue"><BookOpen size={26} /></div>
              <h3 className="sd-card-title">Courses</h3>
              <p className="sd-card-desc">Explore all available courses.</p>
              <button className="sd-card-btn sd-btn-blue">Browse Courses →</button>
            </div>
          </div>

          <div className="sd-card" onClick={() => setShowNotes(true)}>
            <div className="sd-card-accent sd-accent-green" />
            <div className="sd-card-body">
              <div className="sd-card-icon-wrap sd-ci-green"><FileText size={26} /></div>
              <h3 className="sd-card-title">Study Materials</h3>
              <p className="sd-card-desc">You have <strong>{notes.length}</strong> {notes.length === 1 ? 'material' : 'materials'} available.</p>
              <button className="sd-card-btn sd-btn-green">View Materials →</button>
            </div>
          </div>

          <div className="sd-card" onClick={() => navigate('/student-exam')}>
            <div className="sd-card-accent sd-accent-purple" />
            <div className="sd-card-body">
              <div className="sd-card-icon-wrap sd-ci-purple"><ClipboardCheck size={26} /></div>
              <h3 className="sd-card-title">Take Exam</h3>
              <p className="sd-card-desc">Adaptive level exam tailored to your knowledge.</p>
              <button className="sd-card-btn sd-btn-purple">Start Exam →</button>
            </div>
          </div>

          {/* ✅ NEW — My Progress card */}
          <div className="sd-card" onClick={() => navigate('/student-progress')}>
            <div className="sd-card-accent sd-accent-orange" />
            <div className="sd-card-body">
              <div className="sd-card-icon-wrap sd-ci-orange"><TrendingUp size={26} /></div>
              <h3 className="sd-card-title">My Progress</h3>
              <p className="sd-card-desc">View exam history, level achievements &amp; improvement.</p>
              <button className="sd-card-btn sd-btn-orange">View Progress →</button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FAB ── */}
      {!showChatbot && (
        <button className="sd-fab" onClick={() => setShowChatbot(true)}>
          <MessageCircle size={22} />
          <span className="sd-fab-badge"><Sparkles size={10} /></span>
        </button>
      )}

      {/* ── CHATBOT ── */}
      {showChatbot && (
        <div className="sd-chatbot">
          <div className="sd-chat-header">
            <div className="sd-chat-header-left">
              <div className="sd-chat-avatar"><Bot size={20} /></div>
              <div><h3>AI Study Assistant</h3><p className="sd-chat-status"><span className="sd-status-dot" />Online</p></div>
            </div>
            <button className="sd-chat-close" onClick={handleCloseChatbot}><X size={16} /></button>
          </div>
          <div className="sd-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`sd-msg ${msg.role}`}>
                <div className="sd-msg-avatar">{msg.role === 'assistant' ? <Bot size={15} /> : <UserIcon size={15} />}</div>
                <div className="sd-msg-content">
                  {renderContent(msg.content)}
                  <span className="sd-msg-time">{msg.timestamp?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="sd-msg assistant">
                <div className="sd-msg-avatar"><Bot size={15} /></div>
                <div className="sd-msg-content"><div className="sd-typing"><span /><span /><span /></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {messages.length <= 1 && (
            <div className="sd-quick-actions">
              <p className="sd-quick-label">Quick starts:</p>
              <div className="sd-quick-grid">
                {quickActions.map((a, i) => <button key={i} className="sd-quick-btn" onClick={() => setInputMessage(a)}>{a}</button>)}
              </div>
            </div>
          )}
          <div className="sd-chat-input">
            <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKey} placeholder="Type a subject to learn..." disabled={isTyping} />
            <button onClick={handleSend} disabled={!inputMessage.trim() || isTyping} className="sd-send-btn"><Send size={16} /></button>
          </div>
        </div>
      )}

      {/* ── NOTES MODAL ── */}
      {showNotes && (
        <div className="sd-overlay" onClick={() => setShowNotes(false)}>
          <div className="sd-modal sd-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-header">
              <div className="sd-modal-header-icon"><FileText size={20} /></div>
              <div>
                <h2 className="sd-modal-title">Study Materials</h2>
                <p className="sd-modal-sub">{notes.length} {notes.length === 1 ? 'material' : 'materials'}</p>
              </div>
              <button className="sd-modal-close" onClick={() => setShowNotes(false)}><X size={18} /></button>
            </div>
            <div className="sd-modal-body">
              {notes.length === 0 ? (
                <div className="sd-empty">
                  <span className="sd-empty-icon">📚</span>
                  <h3>No materials yet</h3>
                  <p>Materials uploaded by your teachers will appear here.</p>
                </div>
              ) : (
                <div className="sd-notes-grid">
                  {notes.map(note => (
                    <div key={note._id} className="sd-note-card">
                      <div className="sd-note-top">
                        <div className="sd-note-file-icon"><FileText size={15} /></div>
                        <span className="sd-note-badge">{note.subject}</span>
                      </div>
                      <p className="sd-note-title">{note.title}</p>
                      <div className="sd-note-actions">
                        <a href={`http://localhost:5000/uploads/${note.fileUrl}`} target="_blank" rel="noopener noreferrer" className="sd-note-view" download><Download size={13} /> Download</a>
                        <a href={`http://localhost:5000/uploads/${note.fileUrl}`} target="_blank" rel="noopener noreferrer" className="sd-note-preview"><BookOpen size={13} /> View</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}