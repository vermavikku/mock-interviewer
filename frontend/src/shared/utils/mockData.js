/**
 * Comprehensive Mock Data for AI Interview Practice Platform
 */

export const MOCK_USER = {
  id: 'usr_01',
  name: 'Alex Vance',
  username: 'alexvance',
  email: 'alex.vance@engineering.dev',
  role: 'Senior Software Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  interviewsCompleted: 24,
  averageScore: 82,
  practiceTime: '6h 42m',
  currentStreak: 7,
  targetRole: 'Staff Full Stack Engineer',
  skills: ['React', 'Node.js', 'System Design', 'TypeScript', 'GraphQL', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes'],
};

export const MOCK_PERFORMANCE_HISTORY = [
  { session: 'Sess 1', technical: 72, communication: 68, problemSolving: 75, avg: 71 },
  { session: 'Sess 2', technical: 78, communication: 74, problemSolving: 72, avg: 74 },
  { session: 'Sess 3', technical: 80, communication: 82, problemSolving: 78, avg: 80 },
  { session: 'Sess 4', technical: 85, communication: 79, problemSolving: 83, avg: 82 },
  { session: 'Sess 5', technical: 82, communication: 84, problemSolving: 86, avg: 84 },
  { session: 'Sess 6', technical: 88, communication: 82, problemSolving: 85, avg: 85 },
  { session: 'Sess 7', technical: 91, communication: 88, problemSolving: 89, avg: 89 },
];

export const MOCK_INTERVIEWS = [
  {
    id: 'int_01',
    title: 'Backend Systems & Distributed Architecture',
    type: 'Technical',
    role: 'Senior Backend Engineer',
    date: '2026-08-25T14:30:00Z',
    duration: '28 min',
    score: 88,
    status: 'Completed',
    difficulty: 'Hard',
    resumeUsed: 'Alex_Vance_Staff_Resume_2026.pdf',
    subScores: {
      technical: 92,
      communication: 84,
      problemSolving: 88,
      confidence: 88,
    },
    strengths: [
      'In-depth knowledge of distributed consensus & caching strategies (Redis Cluster, CDC)',
      'Clear breakdown of database sharding and idempotency mechanisms',
      'Articulated trade-offs between consistency models (CAP theorem) confidently'
    ],
    improvements: [
      'Quantify the performance bottlenecks more systematically (e.g. latency percentiles p99)',
      'Provide more concrete metrics on past production failure mitigation'
    ],
    recommendations: [
      'Practice distributed tracing (OpenTelemetry) scenarios',
      'Refine answers on zero-downtime database migrations'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Can you walk me through how you designed the distributed authentication and session caching service in your previous architecture?',
        answer: 'We implemented a stateless JWT authorization model backed by an active-active Redis replica cluster for instantaneous revocation tokens and rate limiting. Each API gateway node validated cryptographic signatures locally and communicated with Redis over TLS with connection pooling.',
        feedback: 'Superb explanation of hybrid stateless/stateful token revocation. You clearly explained the latency advantages of local signature verification.',
        score: 94
      },
      {
        id: 'q2',
        question: 'When scaling event-driven microservices with Kafka, how did you handle duplicate events and preserve ordering across partition keys?',
        answer: 'We enforced strict idempotent consumer patterns using distributed transactional outboxes and deduplication keys stored in Postgres with unique constraints. Ordering was guaranteed within partition keys mapped to customer UUIDs.',
        feedback: 'Strong understanding of exactly-once semantics and outbox patterns. Good mention of partition key sharding strategy.',
        score: 90
      },
      {
        id: 'q3',
        question: 'How do you approach cascading failures and circuit breaker patterns in downstream microservices?',
        answer: 'We utilized resilience decorators with Resilience4j/Envoy mesh filters, configuring exponential backoff with jitter and half-open state testing before reopening traffic.',
        feedback: 'Very clear. Mentioning jitter and half-open state transitions demonstrates real-world production experience.',
        score: 86
      }
    ]
  },
  {
    id: 'int_02',
    title: 'Modern React Architecture & Frontend Performance',
    type: 'Technical',
    role: 'Senior Frontend Engineer',
    date: '2026-08-22T10:15:00Z',
    duration: '22 min',
    score: 82,
    status: 'Completed',
    difficulty: 'Medium',
    resumeUsed: 'Alex_Vance_Staff_Resume_2026.pdf',
    subScores: {
      technical: 85,
      communication: 80,
      problemSolving: 82,
      confidence: 81,
    },
    strengths: [
      'Clear grasp of React 19 Concurrent features, Server Actions, and bundle splitting',
      'Strong explanation of rendering lifecycles and virtualized lists for large datasets'
    ],
    improvements: [
      'Deepen explanations on Core Web Vitals (specifically INP and CLS remediation)',
      'Structure state management trade-offs (Redux vs Zustand vs Context) more concisely'
    ],
    recommendations: [
      'Deep dive into Interaction to Next Paint (INP) profiling',
      'Micro-frontend hydration strategies'
    ],
    questions: [
      {
        id: 'q1',
        question: 'How do you optimize initial page load performance and prevent re-render cascades in a complex enterprise React SPA?',
        answer: 'I focus on route-based code splitting with React.lazy, atomic state selectors using Zustand, memoization of expensive computations with useMemo, and offloading heavy filtering to Web Workers.',
        feedback: 'Great actionable answer. Solid mention of web workers and fine-grained selectors.',
        score: 84
      },
      {
        id: 'q2',
        question: 'Can you explain the difference between optimistic UI updates and traditional server-driven mutations in user-facing dashboards?',
        answer: 'Optimistic UI updates immediately update client state assuming success while asynchronously dispatching the network request. If it fails, the UI rolls back with a toast alert and error state.',
        feedback: 'Accurate and concise explanation of rollback handling and user perception.',
        score: 80
      }
    ]
  },
  {
    id: 'int_03',
    title: 'High-Scale System Design: Global Video Streaming',
    type: 'System Design',
    role: 'Staff Infrastructure Engineer',
    date: '2026-08-19T16:00:00Z',
    duration: '35 min',
    score: 79,
    status: 'Completed',
    difficulty: 'Hard',
    resumeUsed: 'Alex_Vance_Staff_Resume_2026.pdf',
    subScores: {
      technical: 81,
      communication: 76,
      problemSolving: 80,
      confidence: 79,
    },
    strengths: [
      'Good high-level architecture diagramming and CDN edge caching strategy',
      'Understood video chunking (HLS/DASH) and adaptive bitrate transcoding'
    ],
    improvements: [
      'Do a more rigorous capacity estimation back-of-the-envelope calculation upfront',
      'Elaborate on geo-DNS failover and multi-region synchronization protocols'
    ],
    recommendations: [
      'Practice capacity estimation math (bandwidth, storage, IOPS calculations)',
      'Multi-region active-active database replication models'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Walk me through the end-to-end ingestion and playback pipeline for 10 million concurrent viewers streaming live events.',
        answer: 'Raw RTMP video is ingested at nearest edge ingress points, routed to transcoding clusters producing multiple bitrate chunks (HLS), stored in hot S3 buckets, and cached heavily across CloudFront edge PoPs.',
        feedback: 'Good high level design. Could have specified estimated egress bandwidth in Tbps.',
        score: 78
      }
    ]
  },
  {
    id: 'int_04',
    title: 'Engineering Leadership & Cross-Functional Conflict',
    type: 'Behavioral',
    role: 'Engineering Manager / Lead',
    date: '2026-08-15T11:00:00Z',
    duration: '25 min',
    score: 85,
    status: 'Completed',
    difficulty: 'Medium',
    resumeUsed: 'Alex_Vance_Staff_Resume_2026.pdf',
    subScores: {
      technical: 80,
      communication: 88,
      problemSolving: 85,
      confidence: 87,
    },
    strengths: [
      'Structured answers using the STAR method (Situation, Task, Action, Result)',
      'Demonstrated high empathy and constructive conflict resolution with product managers'
    ],
    improvements: [
      'Emphasize measurable business impact (KPIs, revenue saved, retention lift)',
      'Elaborate on mentorship programs you initiated for junior engineers'
    ],
    recommendations: [
      'Executive stakeholder communication scenarios',
      'Managing underperforming team members with PIPs'
    ],
    questions: [
      {
        id: 'q1',
        question: 'Tell me about a time when Product requested a feature on an unrealistic deadline with heavy technical debt risks. How did you handle it?',
        answer: 'I organized a trade-off matrix meeting with the VP of Product. We decomposed the feature into an MVP phase that launched on schedule without compromising database schema integrity, scheduling the refactor into the following sprint.',
        feedback: 'Excellent use of structured compromise and risk management.',
        score: 87
      }
    ]
  }
];

export const MOCK_RECOMMENDATION = {
  topic: 'System Design & Distributed Scalability',
  description: 'Your recent interviews show that you can improve your quantitative capacity estimation and multi-region database failover explanations.',
  suggestedType: 'System Design',
  estimatedTime: '30 min',
  impactScore: '+8% Projected Score'
};

export const SAMPLE_RESUMES = [
  {
    id: 'res_01',
    name: 'Alex_Vance_Staff_FullStack_Resume.pdf',
    size: 2457600, // 2.4 MB
    type: 'application/pdf',
    updatedAt: '2026-08-20',
    title: 'Senior / Staff Software Engineer (8+ Yrs Exp)',
    summary: 'Full-stack specialist experienced in React, Node.js, distributed microservices, AWS cloud architecture, and high-load web applications.',
    skills: ['React', 'Node.js', 'TypeScript', 'System Design', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GraphQL']
  },
  {
    id: 'res_02',
    name: 'Alex_Vance_Frontend_Architect.docx',
    size: 1843200, // 1.8 MB
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-08-14',
    title: 'Lead Frontend Engineer & Design Systems',
    summary: 'Expert in modern web performance, React ecosystem, TypeScript, micro-frontends, accessible UI components, and state management.',
    skills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind/CSS', 'Webpack/Vite', 'Testing Library', 'Web Vitals', 'CI/CD']
  }
];

/**
 * Question Bank Generator simulating dynamic question generation from Resume & Interview Config
 */
export function generateInterviewQuestions(config, resume) {
  const type = config?.type || 'Technical';
  const role = config?.role || 'Software Engineer';
  const level = config?.level || 'Senior';

  if (type === 'Technical') {
    return [
      {
        id: 1,
        question: `Welcome! Let's get started. Looking at your resume, you have extensive experience as a ${level} engineer. Can you give me a brief overview of your background and the most impactful architecture project you've led recently?`,
        category: 'Introduction & Core Experience',
        isCoding: false,
        expectedPoints: ['Recent role context', 'High-impact project', 'Technologies used', 'Quantifiable outcome'],
        followUps: [
          'You mentioned microservices and Node.js. How did you handle asynchronous communication and message integrity between those services?',
          'What was the primary bottleneck you encountered when scaling that architecture, and how did you resolve it?'
        ]
      },
      {
        id: 2,
        question: `Let's test your algorithmic problem solving. Please implement an LRU (Least Recently Used) Cache class with get(key) and put(key, value) operations running in O(1) average time complexity. Use the live code editor on your screen to write and test your solution.`,
        category: 'Live Coding Challenge: LRU Cache',
        isCoding: true,
        codingDetails: {
          language: 'javascript',
          timeComplexity: 'O(1) Get and Put',
          constraints: 'Capacity 1 <= capacity <= 3000, Keys & Values are integers',
          starterCode: `/**
 * Implementation of LRU Cache
 * @param {number} capacity
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /** 
   * @param {number} key
   * @return {number}
   */
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  /** 
   * @param {number} key 
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`,
          testCases: [
            { input: 'cache.put(1, 1); cache.put(2, 2); cache.get(1);', expected: '1', passed: true },
            { input: 'cache.put(3, 3); cache.get(2); // evicted', expected: '-1', passed: true },
            { input: 'cache.put(4, 4); cache.get(1);', expected: '-1', passed: true },
          ]
        },
        expectedPoints: ['Double Linked List + HashMap or Map ordering', 'O(1) Eviction', 'Updating recency on get', 'Capacity boundary checks'],
        followUps: [
          'How would you make this LRU cache thread-safe in a multi-threaded or distributed environment?',
          'What happens if we replace LRU with LFU (Least Frequently Used)? What data structures would you need?'
        ]
      },
      {
        id: 3,
        question: `Great job. Now let's test asynchronous programming and concurrency control. Please implement an async task pool / rate limiter: promisePool(functions, limit) that runs an array of async functions concurrently up to the given limit.`,
        category: 'Live Coding Challenge: Async Concurrency',
        isCoding: true,
        codingDetails: {
          language: 'javascript',
          timeComplexity: 'O(N) with O(limit) concurrency',
          constraints: '0 <= limit <= 100, functions array contains async functions',
          starterCode: `/**
 * @param {Function[]} functions - Array of async functions returning promises
 * @param {number} limit - Concurrency limit
 * @return {Promise<any>}
 */
async function promisePool(functions, limit) {
  let i = 0;

  async function next() {
    if (i >= functions.length) return;
    const fn = functions[i++];
    await fn();
    return next();
  }

  const workers = Array.from({ length: Math.min(limit, functions.length) }, () => next());
  return Promise.all(workers);
}
`,
          testCases: [
            { input: 'functions = 5 tasks, limit = 2', expected: 'All 5 resolved in batches of 2', passed: true },
            { input: 'functions = 3 tasks, limit = 5', expected: 'All 3 resolved concurrently', passed: true },
          ]
        },
        expectedPoints: ['Worker recursion or queue pattern', 'Promise.all barrier', 'Error propagation', 'Edge case: limit > tasks'],
        followUps: [
          'How do you handle retries with exponential backoff if one of the promises rejects?'
        ]
      },
      {
        id: 4,
        question: 'You highlighted strong expertise with database optimization and caching. How do you design a high-throughput caching layer while preventing cache stampede, penetration, and stale reads?',
        category: 'Distributed Systems & Caching',
        isCoding: false,
        expectedPoints: ['Redis/Memcached caching strategies', 'Cache stampede mitigation (mutex/locks)', 'TTL & cache warming', 'Invalidation strategies'],
        followUps: [
          'What happens if the primary cache node crashes during peak traffic? How do you prevent cascading database failures?'
        ]
      },
      {
        id: 5,
        question: 'Tell me about a complex production outage or performance degradation incident you personally investigated and debugged. What was the root cause and how did you prevent recurrence?',
        category: 'Problem Solving & Incident Response',
        isCoding: false,
        expectedPoints: ['Systematic debugging approach', 'Observability/APM metrics', 'Root-cause identification', 'Long-term post-mortem fixes'],
        followUps: [
          'How did you communicate with leadership and stakeholders while the incident was actively ongoing?'
        ]
      }
    ];
  }

  if (type === 'System Design') {
    return [
      {
        id: 1,
        question: `Welcome to this System Design session. Let's design a globally distributed URL shortener (like TinyURL or Bitly) that handles 100 million active users generating 500 million new URLs per month with low-latency redirects. How would you approach the high-level architecture?`,
        category: 'High-Level Architecture & Requirements',
        expectedPoints: ['Functional & non-functional requirements', 'Capacity estimation', 'Base62 encoding / Hash strategy', 'API endpoints'],
        followUps: [
          'How do you guarantee unique short URL tokens across distributed generator workers without collisions?',
          'What database schema and indexing strategy would you choose for sub-10ms read lookups?'
        ]
      },
      {
        id: 2,
        question: 'Since the read-to-write ratio is heavily skewed towards reads (e.g. 100:1), how would you design the caching hierarchy and CDN layer to minimize database load?',
        category: 'Caching & Read Optimization',
        expectedPoints: ['LRU Cache strategy', 'CDN edge caching', 'Cache memory sizing', 'Cache invalidation on link updates'],
        followUps: [
          'How would you prevent malicious actors or scrapers from overwhelming the redirect endpoint?'
        ]
      },
      {
        id: 3,
        question: 'Now let\'s consider analytics: the system needs to provide click analytics (geo-location, referrer, timestamp) with near real-time dashboards without slowing down the core redirect path. How do you design this telemetry pipeline?',
        category: 'Telemetry & Event Streaming',
        expectedPoints: ['Asynchronous event streaming (Kafka/Kinesis)', 'Time-series database (ClickHouse/InfluxDB)', 'Batch aggregation workers'],
        followUps: []
      }
    ];
  }

  if (type === 'Behavioral') {
    return [
      {
        id: 1,
        question: 'Welcome! Let\'s begin with your leadership style. Can you describe a situation where you had a strong technical disagreement with a principal engineer or product manager on an architectural decision? How did you navigate the conversation?',
        category: 'Conflict Resolution & Influence',
        expectedPoints: ['Situation setup', 'Objective evaluation of trade-offs', 'Collaborative decision framework', 'Positive team outcome'],
        followUps: [
          'If the final consensus went against your initial preference, how did you commit to the chosen path and rally the team?'
        ]
      },
      {
        id: 2,
        question: 'Tell me about a time when you were mentoring a struggling junior or mid-level engineer who was missing sprint deliverables. What steps did you take to help them succeed?',
        category: 'Mentorship & People Development',
        expectedPoints: ['Identifying root cause', 'Constructive feedback', 'Paired programming / milestones', 'Outcome and growth'],
        followUps: []
      },
      {
        id: 3,
        question: 'Describe a project where the initial scope expanded dramatically mid-cycle, threatening your launch commitments. How did you re-prioritize and manage stakeholder expectations?',
        category: 'Project Management & Agility',
        expectedPoints: ['Scope renegotiation', 'MVP delivery', 'Clear stakeholder communications', 'Post-launch learnings'],
        followUps: []
      }
    ];
  }

  // Default / Mixed / HR
  return [
    {
      id: 1,
      question: 'Tell me about yourself, your career progression, and what motivates you to look for new growth opportunities in your next role.',
      category: 'Introduction & Motivation',
      expectedPoints: ['Concise career summary', 'Core passions', 'Values and ambition'],
      followUps: ['What kind of engineering culture brings out your best work?']
    },
    {
      id: 2,
      question: 'Can you walk me through a challenging technical problem you solved recently that you are particularly proud of?',
      category: 'Technical Accomplishment',
      expectedPoints: ['Problem definition', 'Innovative solution', 'Personal contribution', 'Outcome'],
      followUps: ['What would you do differently if you had to start that project today?']
    },
    {
      id: 3,
      question: 'How do you prioritize your time when balancing multiple critical tasks, sudden production bugs, and code reviews?',
      category: 'Time Management & Focus',
      expectedPoints: ['Eisenhower matrix / prioritization', 'Deep work blocks', 'Proactive communication'],
      followUps: []
    }
  ];
}

/**
 * Dynamic AI Feedback Generator based on user answer evaluation
 */
export function evaluateAnswer(question, answer) {
  const trimmed = (answer || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // Strict check: If skipped or empty, return 0%
  if (!trimmed || trimmed.includes('[Skipped') || wordCount < 5) {
    return {
      score: 0,
      feedback: 'This question was skipped without an answer. Review the recommended ideal answer below to study key concepts and practice your delivery.',
      wordCount: 0,
      timestamp: new Date().toISOString(),
    };
  }

  let score = 70;
  let feedback = 'Good response covering core principles.';

  if (wordCount < 15) {
    score = 35;
    feedback = 'Your answer is brief. Try adding concrete technical examples, specific tools used, and measurable results.';
  } else if (wordCount < 35) {
    score = 65;
    feedback = 'Solid start covering high-level concepts, but could benefit from deeper technical detail and trade-off considerations.';
  } else if (wordCount >= 35 && wordCount <= 120) {
    score = 86;
    feedback = 'Well-structured response! You highlighted key architecture considerations and explained your rationale clearly.';
  } else if (wordCount > 120) {
    score = 92;
    feedback = 'Exceptional, detailed answer. You demonstrated strong domain mastery, addressed edge cases, and communicated trade-offs effectively.';
  }

  return {
    score,
    feedback,
    wordCount,
    timestamp: new Date().toISOString(),
  };
}
