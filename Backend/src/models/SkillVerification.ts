import { Schema, model, models, Types } from "mongoose";

export type SkillStatus = "Verified" | "Not Verified" | "In Progress";
export type SkillCategory = "Web" | "Backend" | "Data" | "DevOps" | "Mobile" | "AI" | "Security" | "Testing" | "Design" | "Other";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

const SKILL_ICONS: Record<string, string> = {
  // Languages
  Python: "🐍", JavaScript: "⚡", TypeScript: "🔷", Java: "☕", C: "🔧", "C++": "⊕", "C#": "🟣",
  Go: "🐹", Rust: "🦀", Ruby: "💎", PHP: "🐘", Swift: "🦜", Kotlin: "🎯",
  Scala: "🔴", R: "📊", MATLAB: "📐", Perl: "🐫", Lua: "🌙", Haskell: "λ",
  Elixir: "💧", Dart: "🎯", "Objective-C": "📱", "Shell Scripting": "🖥️",
  PowerShell: "⚡", Groovy: "🎵", Clojure: "🔄", "F#": "🟦", Solidity: "💎", VHDL: "🔌",
  // Frontend
  React: "⚛️", Angular: "🅰️", "Vue.js": "💚", "Next.js": "▲", "Nuxt.js": "💚",
  Svelte: "🔥", SvelteKit: "🔥", HTML: "🌐", CSS: "🎨", Sass: "💅", Less: "🎨",
  "Tailwind CSS": "🌊", Bootstrap: "🅱️", "Material UI": "Ⓜ️", "Chakra UI": "⚡",
  jQuery: "💲", Webpack: "📦", Vite: "⚡", Babel: "🔄", Gatsby: "🟣",
  Remix: "💿", Astro: "🚀", "Three.js": "🎮", "D3.js": "📊", "Chart.js": "📈",
  "Framer Motion": "🎬", GSAP: "🟩", "Progressive Web Apps": "📱",
  // Backend
  "Node.js": "🟢", Express: "🚂", Fastify: "⚡", NestJS: "🐱", Koa: "🫖",
  Django: "🎸", Flask: "🍶", FastAPI: "⚡", "Spring Boot": "🌱", "Spring Framework": "🌱",
  "Ruby on Rails": "🛤️", Laravel: "🔺", "ASP.NET": "🔵", ".NET Core": "🔵",
  Gin: "🍸", Fiber: "🔗", Actix: "🦀", Phoenix: "🔥", Ktor: "🟣",
  "REST APIs": "🔌", GraphQL: "◈", gRPC: "📡", WebSockets: "🔗",
  Microservices: "🧩", "Serverless Architecture": "⚡", "API Design": "📋",
  "OAuth 2.0": "🔐", "JWT Authentication": "🎫",
  // Databases
  SQL: "🗃️", PostgreSQL: "🐘", MySQL: "🐬", SQLite: "📁", MongoDB: "🍃",
  Redis: "🔴", Cassandra: "👁️", DynamoDB: "⚡", Neo4j: "🕸️",
  Elasticsearch: "🔍", Firestore: "🔥", Supabase: "⚡", Prisma: "🔷",
  Sequelize: "🔗", TypeORM: "🔷", Mongoose: "🍃", "Drizzle ORM": "💧",
  "Database Design": "🏗️", "Data Modeling": "📐",
  // DevOps & Cloud
  Docker: "🐳", Kubernetes: "☸️", AWS: "☁️", GCP: "🌩️", Azure: "💙",
  "CI/CD": "🔄", Git: "📦", "GitHub Actions": "🔧", "GitLab CI": "🦊",
  Jenkins: "🤖", Terraform: "🏗️", Ansible: "🔧", Pulumi: "💜",
  Nginx: "🟩", Linux: "🐧", Ubuntu: "🟠", "AWS Lambda": "⚡",
  Prometheus: "🔥", Grafana: "📊", Datadog: "🐶", Helm: "⎈", ArgoCD: "🔄",
  // Data & Analytics
  Pandas: "🐼", NumPy: "🔢", Spark: "✨", Hadoop: "🐘",
  "Apache Kafka": "📨", "Apache Airflow": "🌬️", dbt: "🔧",
  Snowflake: "❄️", BigQuery: "🔍", Redshift: "🔴", Databricks: "🧱",
  "Power BI": "📊", Tableau: "📈", Looker: "👀", Excel: "📗",
  "Data Visualization": "📊", "Statistical Analysis": "📉", "A/B Testing": "🧪",
  // AI / ML
  "Machine Learning": "🤖", "Deep Learning": "🧠", TensorFlow: "🧠",
  PyTorch: "🔥", Keras: "🔴", "Scikit-learn": "🔬",
  "Natural Language Processing": "💬", "Computer Vision": "👁️",
  "Generative AI": "✨", "Large Language Models": "🤖", "Prompt Engineering": "💡",
  "Hugging Face": "🤗", LangChain: "🔗", "OpenAI API": "🤖",
  MLOps: "🔄", MLflow: "📊", "Neural Networks": "🕸️", Transformers: "🔄",
  // Mobile
  "React Native": "📱", Flutter: "🦋", SwiftUI: "📱", "Jetpack Compose": "🟩",
  "Android Development": "🤖", "iOS Development": "🍎", Expo: "📱",
  // Security
  Cybersecurity: "🔒", "Penetration Testing": "🎯", "Network Security": "🛡️",
  "Web Application Security": "🔐", OWASP: "🛡️", Encryption: "🔑",
  "Secure Coding": "🔒", "Threat Modeling": "🎯",
  // Testing
  "Unit Testing": "✅", "Integration Testing": "🔗", "End-to-End Testing": "🔄",
  Jest: "🃏", Cypress: "🌲", Playwright: "🎭", Selenium: "🌐",
  Postman: "📮", "Test-Driven Development": "✅",
  // Architecture
  "System Design": "🏗️", "Software Architecture": "🏛️", "Design Patterns": "🧩",
  "Distributed Systems": "🌐", Scalability: "📈", "SOLID Principles": "🧱",
  "Object-Oriented Programming": "🧩", "Functional Programming": "λ",
  // Design
  "UI/UX Design": "🎨", Figma: "🎨", "Wireframing": "📐", "Prototyping": "🔧",
  "User Research": "🔍", "Design Systems": "🎨", Accessibility: "♿",
  // Misc
  "Technical Leadership": "👨‍💼", "Code Review": "👀", "Problem Solving": "🧠",
  "Data Structures": "🌳", Algorithms: "⚙️", "Competitive Programming": "🏆",
  Blockchain: "⛓️", Ethereum: "💎", Unity: "🎮", "Unreal Engine": "🎮",
  "Embedded Systems": "🔌", Arduino: "🔧", "Raspberry Pi": "🍓", IoT: "📡",
  "Agile Methodology": "🔄", Scrum: "📋", Jira: "📌", "Technical Writing": "📝",
};

const SKILL_CATEGORIES: Record<string, SkillCategory> = {
  // Languages → Backend (default for compiled/general-purpose)
  Python: "Backend", JavaScript: "Web", TypeScript: "Web", Java: "Backend",
  C: "Backend", "C++": "Backend", "C#": "Backend", Go: "Backend", Rust: "Backend",
  Ruby: "Backend", PHP: "Backend", Swift: "Mobile", Kotlin: "Mobile",
  Scala: "Backend", R: "Data", MATLAB: "Data", Dart: "Mobile",
  "Objective-C": "Mobile", "Shell Scripting": "DevOps", PowerShell: "DevOps",
  Solidity: "Web", Haskell: "Backend", Elixir: "Backend",
  // Frontend
  React: "Web", Angular: "Web", "Vue.js": "Web", "Next.js": "Web", "Nuxt.js": "Web",
  Svelte: "Web", SvelteKit: "Web", HTML: "Web", CSS: "Web", Sass: "Web", Less: "Web",
  "Tailwind CSS": "Web", Bootstrap: "Web", "Material UI": "Web", "Chakra UI": "Web",
  jQuery: "Web", Webpack: "Web", Vite: "Web", Babel: "Web", Gatsby: "Web",
  Remix: "Web", Astro: "Web", "Three.js": "Web", "D3.js": "Web", "Chart.js": "Web",
  "Framer Motion": "Web", GSAP: "Web", "Progressive Web Apps": "Web",
  "Responsive Design": "Web", "Web Components": "Web", WebGL: "Web",
  // Backend
  "Node.js": "Backend", Express: "Backend", Fastify: "Backend", NestJS: "Backend",
  Koa: "Backend", Hapi: "Backend", Django: "Backend", Flask: "Backend",
  FastAPI: "Backend", "Spring Boot": "Backend", "Spring Framework": "Backend",
  "Ruby on Rails": "Backend", Laravel: "Backend", Symfony: "Backend",
  "ASP.NET": "Backend", ".NET Core": "Backend", Gin: "Backend", Echo: "Backend",
  Fiber: "Backend", Actix: "Backend", Phoenix: "Backend", Ktor: "Backend",
  "REST APIs": "Backend", GraphQL: "Backend", gRPC: "Backend", WebSockets: "Backend",
  Microservices: "Backend", "Serverless Architecture": "Backend",
  "Event-Driven Architecture": "Backend", "Message Queues": "Backend",
  "API Design": "Backend", "OAuth 2.0": "Backend", "JWT Authentication": "Backend",
  // Databases
  SQL: "Data", PostgreSQL: "Data", MySQL: "Data", SQLite: "Data", MariaDB: "Data",
  "Oracle Database": "Data", "Microsoft SQL Server": "Data", MongoDB: "Data",
  Redis: "Data", Cassandra: "Data", DynamoDB: "Data", CouchDB: "Data",
  Neo4j: "Data", InfluxDB: "Data", Elasticsearch: "Data",
  "Firebase Realtime Database": "Data", Firestore: "Data", Supabase: "Data",
  PlanetScale: "Data", Prisma: "Data", Sequelize: "Data", TypeORM: "Data",
  Mongoose: "Data", "Drizzle ORM": "Data", "Database Design": "Data",
  "Data Modeling": "Data", "Database Administration": "Data",
  // DevOps
  Docker: "DevOps", Kubernetes: "DevOps", AWS: "DevOps", GCP: "DevOps",
  Azure: "DevOps", "CI/CD": "DevOps", Git: "DevOps", "GitHub Actions": "DevOps",
  "GitLab CI": "DevOps", Jenkins: "DevOps", CircleCI: "DevOps", "Travis CI": "DevOps",
  Terraform: "DevOps", Ansible: "DevOps", Pulumi: "DevOps", CloudFormation: "DevOps",
  Nginx: "DevOps", Apache: "DevOps", Linux: "DevOps", Ubuntu: "DevOps",
  "Amazon EC2": "DevOps", "Amazon S3": "DevOps", "AWS Lambda": "DevOps",
  "Google Cloud Functions": "DevOps", "Azure Functions": "DevOps",
  Prometheus: "DevOps", Grafana: "DevOps", Datadog: "DevOps", "New Relic": "DevOps",
  "ELK Stack": "DevOps", Helm: "DevOps", Istio: "DevOps", ArgoCD: "DevOps",
  // Data & Analytics
  Pandas: "Data", NumPy: "Data", SciPy: "Data", Spark: "Data", Hadoop: "Data",
  Hive: "Data", "Apache Kafka": "Data", "Apache Airflow": "Data",
  "Apache Flink": "Data", "Apache Beam": "Data", dbt: "Data",
  Snowflake: "Data", BigQuery: "Data", Redshift: "Data", Databricks: "Data",
  "ETL Pipelines": "Data", "Data Warehousing": "Data", "Data Lake": "Data",
  "Power BI": "Data", Tableau: "Data", Looker: "Data", Metabase: "Data",
  Excel: "Data", "Data Visualization": "Data", "Statistical Analysis": "Data",
  "A/B Testing": "Data", "SQL Analytics": "Data",
  // AI / ML
  "Machine Learning": "AI", "Deep Learning": "AI", TensorFlow: "AI",
  PyTorch: "AI", Keras: "AI", "Scikit-learn": "AI", XGBoost: "AI",
  LightGBM: "AI", CatBoost: "AI", "Natural Language Processing": "AI",
  "Computer Vision": "AI", "Reinforcement Learning": "AI",
  "Generative AI": "AI", "Large Language Models": "AI", "Prompt Engineering": "AI",
  "Hugging Face": "AI", LangChain: "AI", "OpenAI API": "AI",
  "Stable Diffusion": "AI", MLOps: "AI", MLflow: "AI", Kubeflow: "AI",
  "Weights & Biases": "AI", "Feature Engineering": "AI", "Model Deployment": "AI",
  "Neural Networks": "AI", "Convolutional Neural Networks": "AI",
  "Recurrent Neural Networks": "AI", Transformers: "AI", GANs: "AI",
  "Recommendation Systems": "AI", "Time Series Analysis": "AI",
  "Anomaly Detection": "AI",
  // Mobile
  "React Native": "Mobile", Flutter: "Mobile", SwiftUI: "Mobile", UIKit: "Mobile",
  "Jetpack Compose": "Mobile", "Android Development": "Mobile",
  "iOS Development": "Mobile", Xamarin: "Mobile", Ionic: "Mobile",
  Capacitor: "Mobile", Expo: "Mobile", "Mobile UI Design": "Mobile",
  // Security
  Cybersecurity: "Security", "Penetration Testing": "Security",
  "Network Security": "Security", "Web Application Security": "Security",
  OWASP: "Security", Encryption: "Security", "Identity & Access Management": "Security",
  SIEM: "Security", "Vulnerability Assessment": "Security",
  "Security Auditing": "Security", "Incident Response": "Security",
  "Threat Modeling": "Security", "Secure Coding": "Security",
  // Testing
  "Unit Testing": "Testing", "Integration Testing": "Testing",
  "End-to-End Testing": "Testing", Jest: "Testing", Mocha: "Testing",
  Chai: "Testing", Cypress: "Testing", Playwright: "Testing", Selenium: "Testing",
  Puppeteer: "Testing", "React Testing Library": "Testing", JUnit: "Testing",
  PyTest: "Testing", "Test-Driven Development": "Testing",
  "Behavior-Driven Development": "Testing", "Load Testing": "Testing",
  "Performance Testing": "Testing", "API Testing": "Testing", Postman: "Testing",
  // Architecture
  "System Design": "Backend", "Software Architecture": "Backend",
  "Design Patterns": "Backend", "Domain-Driven Design": "Backend",
  "Clean Architecture": "Backend", "SOLID Principles": "Backend",
  "Object-Oriented Programming": "Backend", "Functional Programming": "Backend",
  "Distributed Systems": "Backend", Scalability: "Backend",
  "High Availability": "Backend", "Event Sourcing": "Backend", CQRS: "Backend",
  // Design
  "UI/UX Design": "Design", Figma: "Design", Sketch: "Design",
  "Adobe XD": "Design", Wireframing: "Design", Prototyping: "Design",
  "User Research": "Design", "Usability Testing": "Design",
  Accessibility: "Web", "Design Systems": "Design",
  "Information Architecture": "Design", "Interaction Design": "Design",
  // Other
  "Technical Leadership": "Other", "Code Review": "Other", Mentoring: "Other",
  "Problem Solving": "Other", "Data Structures": "Other", Algorithms: "Other",
  "Competitive Programming": "Other", Networking: "Other",
  WebAssembly: "Web", "Operating Systems": "Other",
  "Agile Methodology": "Other", Scrum: "Other", Jira: "Other",
  "Technical Writing": "Other", Blockchain: "Web", Ethereum: "Web",
  Unity: "Other", "Unreal Engine": "Other", Godot: "Other",
  "Embedded Systems": "Other", Arduino: "Other", "Raspberry Pi": "Other",
  IoT: "Other",
};

const SKILL_DIFFICULTIES: Record<string, Difficulty> = {
  // Beginner
  Git: "Beginner", HTML: "Beginner", CSS: "Beginner", MongoDB: "Beginner",
  Excel: "Beginner", Postman: "Beginner", SQLite: "Beginner",
  Bootstrap: "Beginner", jQuery: "Beginner", Arduino: "Beginner",
  "Raspberry Pi": "Beginner",
  // Advanced
  Kubernetes: "Advanced", "System Design": "Advanced", "Machine Learning": "Advanced",
  TensorFlow: "Advanced", PyTorch: "Advanced", "C++": "Advanced", Rust: "Advanced",
  "Software Architecture": "Advanced", "Distributed Systems": "Advanced",
  "Deep Learning": "Advanced", "Large Language Models": "Advanced",
  "Computer Vision": "Advanced", Transformers: "Advanced",
  "Domain-Driven Design": "Advanced", CQRS: "Advanced",
  "Event Sourcing": "Advanced", Scalability: "Advanced",
  "High Availability": "Advanced", "Penetration Testing": "Advanced",
  Haskell: "Advanced", Assembly: "Advanced", "Shader Programming": "Advanced",
  "Competitive Programming": "Advanced",
  // Everything else defaults to Intermediate (handled in getSkillMeta)
};

export function getSkillMeta(name: string) {
  return {
    icon: SKILL_ICONS[name] ?? "💡",
    category: SKILL_CATEGORIES[name] ?? "Backend",
    difficulty: SKILL_DIFFICULTIES[name] ?? "Intermediate",
  };
}

const SkillVerificationSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "💡" },
    category: { type: String, enum: ["Web", "Backend", "Data", "DevOps", "Mobile", "AI", "Security", "Testing", "Design", "Other"], default: "Backend" },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Intermediate" },
    status: { type: String, enum: ["Verified", "Not Verified", "In Progress"], default: "Not Verified" },
    score: { type: Number },
  },
  { timestamps: true }
);

SkillVerificationSchema.index({ studentId: 1, name: 1 }, { unique: true });

export const SkillVerification = models["SkillVerification"] ?? model("SkillVerification", SkillVerificationSchema);
