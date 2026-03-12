
// ─── Skills (LinkedIn-style broad set) ──────────────────────────────────
const SKILLS_LIST: string[] = [
  // Languages
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Lua',
  'Haskell', 'Elixir', 'Dart', 'Objective-C', 'Shell Scripting', 'PowerShell',
  'Assembly', 'Groovy', 'Clojure', 'F#', 'Solidity', 'VHDL',

  // Frontend
  'React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Svelte', 'SvelteKit',
  'HTML', 'CSS', 'Sass', 'Less', 'Tailwind CSS', 'Bootstrap', 'Material UI',
  'Chakra UI', 'Styled Components', 'Storybook', 'Webpack', 'Vite', 'Babel',
  'jQuery', 'Ember.js', 'Backbone.js', 'Alpine.js', 'Astro', 'Remix',
  'Gatsby', 'Web Components', 'Progressive Web Apps', 'WebGL', 'Three.js',
  'D3.js', 'Chart.js', 'Framer Motion', 'GSAP',

  // Backend
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Koa', 'Hapi',
  'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring Framework',
  'Ruby on Rails', 'Laravel', 'Symfony', 'ASP.NET', '.NET Core',
  'Gin', 'Echo', 'Fiber', 'Actix', 'Phoenix', 'Ktor',
  'REST APIs', 'GraphQL', 'gRPC', 'WebSockets', 'Server-Sent Events',
  'Microservices', 'Serverless Architecture', 'Event-Driven Architecture',
  'Message Queues', 'API Design', 'OAuth 2.0', 'JWT Authentication',

  // Databases
  'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MariaDB', 'Oracle Database',
  'Microsoft SQL Server', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
  'CouchDB', 'Neo4j', 'InfluxDB', 'Elasticsearch', 'Firebase Realtime Database',
  'Firestore', 'Supabase', 'PlanetScale', 'Prisma', 'Sequelize',
  'TypeORM', 'Mongoose', 'Drizzle ORM', 'Database Design',
  'Data Modeling', 'Database Administration',

  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD',
  'Git', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'Travis CI',
  'Terraform', 'Ansible', 'Pulumi', 'CloudFormation',
  'Nginx', 'Apache', 'Caddy', 'HAProxy',
  'Linux', 'Ubuntu', 'CentOS', 'Amazon EC2', 'Amazon S3',
  'AWS Lambda', 'Google Cloud Functions', 'Azure Functions',
  'Amazon ECS', 'Amazon EKS', 'Google Kubernetes Engine',
  'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'ELK Stack',
  'Helm', 'Istio', 'ArgoCD', 'Vagrant', 'Packer',

  // Data & Analytics
  'Pandas', 'NumPy', 'SciPy', 'Spark', 'Hadoop', 'Hive',
  'Apache Kafka', 'Apache Airflow', 'Apache Flink', 'Apache Beam',
  'dbt', 'Snowflake', 'BigQuery', 'Redshift', 'Databricks',
  'ETL Pipelines', 'Data Warehousing', 'Data Lake', 'Data Governance',
  'Power BI', 'Tableau', 'Looker', 'Metabase', 'Superset',
  'Excel', 'Google Sheets', 'Data Visualization', 'Statistical Analysis',
  'A/B Testing', 'SQL Analytics',

  // Machine Learning & AI
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
  'Scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost',
  'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning',
  'Generative AI', 'Large Language Models', 'Prompt Engineering',
  'Hugging Face', 'LangChain', 'OpenAI API', 'Stable Diffusion',
  'MLOps', 'MLflow', 'Kubeflow', 'Weights & Biases',
  'Feature Engineering', 'Model Deployment', 'Neural Networks',
  'Convolutional Neural Networks', 'Recurrent Neural Networks',
  'Transformers', 'GANs', 'Recommendation Systems',
  'Time Series Analysis', 'Anomaly Detection',

  // Mobile
  'React Native', 'Flutter', 'SwiftUI', 'UIKit', 'Jetpack Compose',
  'Android Development', 'iOS Development', 'Xamarin', 'Ionic',
  'Capacitor', 'Expo', 'Mobile UI Design', 'App Store Optimization',
  'Push Notifications', 'Mobile Security',

  // Security
  'Cybersecurity', 'Penetration Testing', 'Network Security',
  'Web Application Security', 'OWASP', 'Encryption',
  'Identity & Access Management', 'SIEM', 'Vulnerability Assessment',
  'Security Auditing', 'CompTIA Security+', 'SOC Analysis',
  'Incident Response', 'Threat Modeling', 'Secure Coding',

  // Testing & QA
  'Unit Testing', 'Integration Testing', 'End-to-End Testing',
  'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright', 'Selenium',
  'Puppeteer', 'React Testing Library', 'JUnit', 'PyTest',
  'Test-Driven Development', 'Behavior-Driven Development',
  'Load Testing', 'Performance Testing', 'API Testing', 'Postman',

  // Architecture & Design
  'System Design', 'Software Architecture', 'Design Patterns',
  'Domain-Driven Design', 'Clean Architecture', 'SOLID Principles',
  'Object-Oriented Programming', 'Functional Programming',
  'Distributed Systems', 'Scalability', 'High Availability',
  'Caching Strategies', 'Load Balancing', 'CAP Theorem',
  'Event Sourcing', 'CQRS',

  // Project & Product
  'Agile Methodology', 'Scrum', 'Kanban', 'Jira', 'Confluence',
  'Product Management', 'Project Management', 'Technical Writing',
  'Requirements Analysis', 'User Stories', 'Sprint Planning',

  // Design & UX
  'UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'InVision',
  'Wireframing', 'Prototyping', 'User Research', 'Usability Testing',
  'Responsive Design', 'Accessibility', 'Design Systems',
  'Information Architecture', 'Interaction Design',

  // Blockchain & Web3
  'Blockchain', 'Ethereum', 'Smart Contracts', 'Solidity',
  'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle', 'DeFi',
  'NFTs', 'IPFS', 'Hyperledger',

  // Game Development
  'Unity', 'Unreal Engine', 'Godot', 'Game Design',
  'Game Physics', '2D Game Development', '3D Game Development',
  'Shader Programming',

  // Embedded & IoT
  'Embedded Systems', 'Arduino', 'Raspberry Pi', 'IoT',
  'RTOS', 'Firmware Development', 'MQTT', 'Zigbee',
  'Edge Computing', 'Microcontrollers',

  // Other
  'Technical Leadership', 'Code Review', 'Mentoring',
  'Open Source Contribution', 'Documentation', 'Problem Solving',
  'Data Structures', 'Algorithms', 'Competitive Programming',
  'Networking', 'TCP/IP', 'DNS', 'HTTP/HTTPS',
  'WebAssembly', 'Regex', 'Compilers', 'Operating Systems',
];

// ─── Roles with required skill tags ──────────────────────────────────
export interface RoleDefinition {
  name: string;
  category: string;
  coreSkills: string[];
  bonusSkills: string[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  // ── Software Engineering ──
  {
    name: 'Frontend Developer',
    category: 'Software Engineering',
    coreSkills: ['JavaScript', 'HTML', 'CSS', 'React', 'TypeScript', 'Git', 'Responsive Design'],
    bonusSkills: ['Next.js', 'Tailwind CSS', 'Webpack', 'Vite', 'Jest', 'Cypress', 'Storybook', 'Figma', 'Accessibility', 'Progressive Web Apps'],
  },
  {
    name: 'Backend Developer',
    category: 'Software Engineering',
    coreSkills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Git', 'Database Design', 'Docker'],
    bonusSkills: ['Express', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'Microservices', 'CI/CD', 'Kubernetes', 'Message Queues'],
  },
  {
    name: 'Full Stack Developer',
    category: 'Software Engineering',
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'HTML', 'CSS'],
    bonusSkills: ['Next.js', 'Express', 'PostgreSQL', 'MongoDB', 'Docker', 'CI/CD', 'Tailwind CSS', 'GraphQL', 'AWS', 'System Design'],
  },
  {
    name: 'Software Architect',
    category: 'Software Engineering',
    coreSkills: ['System Design', 'Software Architecture', 'Design Patterns', 'Distributed Systems', 'Microservices', 'Cloud Architecture'],
    bonusSkills: ['AWS', 'Kubernetes', 'Event-Driven Architecture', 'Domain-Driven Design', 'CQRS', 'Scalability', 'High Availability', 'Technical Leadership'],
  },
  {
    name: 'API Developer',
    category: 'Software Engineering',
    coreSkills: ['REST APIs', 'API Design', 'Node.js', 'SQL', 'Git', 'Postman'],
    bonusSkills: ['GraphQL', 'gRPC', 'OAuth 2.0', 'JWT Authentication', 'Swagger', 'WebSockets', 'Rate Limiting', 'API Testing'],
  },

  // ── Data ──
  {
    name: 'Data Engineer',
    category: 'Data',
    coreSkills: ['Python', 'SQL', 'ETL Pipelines', 'Spark', 'Data Warehousing', 'Git'],
    bonusSkills: ['Apache Kafka', 'Apache Airflow', 'dbt', 'Snowflake', 'BigQuery', 'Hadoop', 'AWS', 'Docker', 'Data Lake', 'Data Modeling'],
  },
  {
    name: 'Data Analyst',
    category: 'Data',
    coreSkills: ['SQL', 'Python', 'Excel', 'Data Visualization', 'Statistical Analysis'],
    bonusSkills: ['Pandas', 'Power BI', 'Tableau', 'A/B Testing', 'R', 'Google Sheets', 'Looker', 'SQL Analytics', 'NumPy'],
  },
  {
    name: 'Data Scientist',
    category: 'Data',
    coreSkills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Statistical Analysis', 'Data Visualization'],
    bonusSkills: ['Scikit-learn', 'TensorFlow', 'PyTorch', 'Deep Learning', 'Feature Engineering', 'NumPy', 'A/B Testing', 'R', 'NLP', 'Time Series Analysis'],
  },
  {
    name: 'Business Intelligence Analyst',
    category: 'Data',
    coreSkills: ['SQL', 'Power BI', 'Data Visualization', 'Excel', 'Statistical Analysis'],
    bonusSkills: ['Tableau', 'Looker', 'Python', 'dbt', 'Snowflake', 'BigQuery', 'Data Modeling', 'A/B Testing'],
  },

  // ── AI / ML ──
  {
    name: 'ML Engineer',
    category: 'AI / ML',
    coreSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Git'],
    bonusSkills: ['Deep Learning', 'MLOps', 'Docker', 'Kubernetes', 'Feature Engineering', 'Model Deployment', 'Scikit-learn', 'MLflow', 'AWS', 'Spark'],
  },
  {
    name: 'AI Engineer',
    category: 'AI / ML',
    coreSkills: ['Python', 'Machine Learning', 'Deep Learning', 'Large Language Models', 'REST APIs'],
    bonusSkills: ['LangChain', 'OpenAI API', 'Hugging Face', 'Prompt Engineering', 'Generative AI', 'Transformers', 'Docker', 'FastAPI', 'Vector Databases'],
  },
  {
    name: 'NLP Engineer',
    category: 'AI / ML',
    coreSkills: ['Python', 'Natural Language Processing', 'Machine Learning', 'Deep Learning', 'Transformers'],
    bonusSkills: ['Hugging Face', 'Large Language Models', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'spaCy', 'NLTK', 'Text Classification'],
  },
  {
    name: 'Computer Vision Engineer',
    category: 'AI / ML',
    coreSkills: ['Python', 'Computer Vision', 'Deep Learning', 'Convolutional Neural Networks', 'TensorFlow'],
    bonusSkills: ['PyTorch', 'OpenCV', 'Image Classification', 'Object Detection', 'Model Deployment', 'GANs', 'Docker'],
  },

  // ── DevOps & Cloud ──
  {
    name: 'DevOps Engineer',
    category: 'DevOps & Cloud',
    coreSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Git', 'AWS', 'Terraform'],
    bonusSkills: ['Ansible', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana', 'Helm', 'ArgoCD', 'Shell Scripting', 'Nginx', 'ELK Stack'],
  },
  {
    name: 'Cloud Architect',
    category: 'DevOps & Cloud',
    coreSkills: ['AWS', 'System Design', 'Terraform', 'Docker', 'Kubernetes', 'Networking'],
    bonusSkills: ['GCP', 'Azure', 'Serverless Architecture', 'CloudFormation', 'Microservices', 'High Availability', 'Scalability', 'Security'],
  },
  {
    name: 'Site Reliability Engineer',
    category: 'DevOps & Cloud',
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Prometheus', 'Grafana', 'Shell Scripting'],
    bonusSkills: ['AWS', 'Terraform', 'Incident Response', 'Load Balancing', 'High Availability', 'ELK Stack', 'Python', 'Go'],
  },
  {
    name: 'Platform Engineer',
    category: 'DevOps & Cloud',
    coreSkills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Git'],
    bonusSkills: ['Helm', 'ArgoCD', 'Istio', 'AWS', 'Prometheus', 'Go', 'Python', 'Internal Developer Platforms'],
  },

  // ── Mobile ──
  {
    name: 'Mobile Developer',
    category: 'Mobile',
    coreSkills: ['React Native', 'JavaScript', 'TypeScript', 'Git', 'Mobile UI Design'],
    bonusSkills: ['Flutter', 'iOS Development', 'Android Development', 'Expo', 'Push Notifications', 'REST APIs', 'Firebase Realtime Database'],
  },
  {
    name: 'iOS Developer',
    category: 'Mobile',
    coreSkills: ['Swift', 'SwiftUI', 'UIKit', 'iOS Development', 'Git', 'REST APIs'],
    bonusSkills: ['Objective-C', 'Core Data', 'Push Notifications', 'App Store Optimization', 'Unit Testing', 'CI/CD'],
  },
  {
    name: 'Android Developer',
    category: 'Mobile',
    coreSkills: ['Kotlin', 'Jetpack Compose', 'Android Development', 'Git', 'REST APIs'],
    bonusSkills: ['Java', 'Firebase Realtime Database', 'Push Notifications', 'Unit Testing', 'CI/CD', 'Material UI'],
  },

  // ── Security ──
  {
    name: 'Security Engineer',
    category: 'Security',
    coreSkills: ['Cybersecurity', 'Network Security', 'Web Application Security', 'OWASP', 'Linux'],
    bonusSkills: ['Penetration Testing', 'Encryption', 'SIEM', 'Vulnerability Assessment', 'Incident Response', 'Secure Coding', 'Threat Modeling', 'Python'],
  },
  {
    name: 'Penetration Tester',
    category: 'Security',
    coreSkills: ['Penetration Testing', 'Web Application Security', 'Network Security', 'Linux', 'OWASP'],
    bonusSkills: ['Python', 'Shell Scripting', 'Vulnerability Assessment', 'Cybersecurity', 'Encryption', 'Threat Modeling'],
  },

  // ── QA & Testing ──
  {
    name: 'QA Engineer',
    category: 'QA & Testing',
    coreSkills: ['Unit Testing', 'Integration Testing', 'End-to-End Testing', 'Git', 'API Testing'],
    bonusSkills: ['Cypress', 'Playwright', 'Selenium', 'Jest', 'Postman', 'Load Testing', 'Performance Testing', 'Test-Driven Development'],
  },
  {
    name: 'SDET',
    category: 'QA & Testing',
    coreSkills: ['JavaScript', 'Python', 'Cypress', 'Playwright', 'CI/CD', 'Git', 'API Testing'],
    bonusSkills: ['Selenium', 'Jest', 'Docker', 'Performance Testing', 'Test-Driven Development', 'Postman'],
  },

  // ── Design ──
  {
    name: 'UX Designer',
    category: 'Design',
    coreSkills: ['UI/UX Design', 'Figma', 'User Research', 'Wireframing', 'Prototyping'],
    bonusSkills: ['Usability Testing', 'Design Systems', 'Accessibility', 'Information Architecture', 'Interaction Design', 'Sketch', 'Adobe XD'],
  },
  {
    name: 'UI Developer',
    category: 'Design',
    coreSkills: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Responsive Design', 'Accessibility'],
    bonusSkills: ['React', 'Tailwind CSS', 'Design Systems', 'Storybook', 'Framer Motion', 'GSAP', 'Sass'],
  },

  // ── Game Dev ──
  {
    name: 'Game Developer',
    category: 'Game Development',
    coreSkills: ['Unity', 'C#', 'Game Design', 'Git', '3D Game Development'],
    bonusSkills: ['Unreal Engine', 'C++', 'Shader Programming', 'Game Physics', '2D Game Development', 'Godot'],
  },

  // ── Blockchain ──
  {
    name: 'Blockchain Developer',
    category: 'Blockchain',
    coreSkills: ['Solidity', 'Ethereum', 'Smart Contracts', 'JavaScript', 'Git'],
    bonusSkills: ['Web3.js', 'Ethers.js', 'Hardhat', 'DeFi', 'IPFS', 'React', 'TypeScript'],
  },

  // ── Embedded / IoT ──
  {
    name: 'Embedded Systems Engineer',
    category: 'Embedded & IoT',
    coreSkills: ['C', 'C++', 'Embedded Systems', 'RTOS', 'Firmware Development'],
    bonusSkills: ['Arduino', 'Raspberry Pi', 'IoT', 'MQTT', 'Microcontrollers', 'Assembly', 'Linux'],
  },

  // ── Product & Management ──
  {
    name: 'Technical Product Manager',
    category: 'Product & Management',
    coreSkills: ['Product Management', 'Agile Methodology', 'Jira', 'Requirements Analysis', 'Technical Writing'],
    bonusSkills: ['SQL', 'Data Visualization', 'User Stories', 'Sprint Planning', 'Scrum', 'A/B Testing'],
  },
  {
    name: 'Engineering Manager',
    category: 'Product & Management',
    coreSkills: ['Technical Leadership', 'Agile Methodology', 'System Design', 'Code Review', 'Mentoring'],
    bonusSkills: ['Scrum', 'Jira', 'Project Management', 'Sprint Planning', 'Software Architecture'],
  },
];

const TARGET_ROLES: string[] = ROLE_DEFINITIONS.map(r => r.name);

export { SKILLS_LIST, TARGET_ROLES, ROLE_DEFINITIONS };
