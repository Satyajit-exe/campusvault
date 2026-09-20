import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

// Models
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Course } from '../models/Course.js';
import { Branch } from '../models/Branch.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { Semester } from '../models/Semester.js';
import { Subject } from '../models/Subject.js';
import { Module } from '../models/Module.js';
import { Resource } from '../models/Resource.js';
import { Bookmark } from '../models/Bookmark.js';
import { StudyProgress } from '../models/StudyProgress.js';
import { MaterialRequest } from '../models/MaterialRequest.js';

// Helper to generate realistic PDF on disk
function generateSamplePdf(filePath, title, subtitle, sections = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header Banner
    doc
      .rect(50, 40, 495, 60)
      .fill('#4F46E5');

    doc
      .fontSize(16)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('CAMPUSVAULT ACADEMIC ARCHIVE', 65, 55);

    doc
      .fontSize(10)
      .fillColor('#E0E7FF')
      .font('Helvetica')
      .text('Verified Academic Resource • For Educational Reference Only', 65, 76);

    doc.moveDown(3);

    // Title Section
    doc
      .fillColor('#1E293B')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title, 50, 125);

    doc
      .fillColor('#64748B')
      .fontSize(11)
      .font('Helvetica')
      .text(subtitle, 50, 150);

    doc
      .moveTo(50, 170)
      .lineTo(545, 170)
      .strokeColor('#CBD5E1')
      .stroke();

    let currentY = 190;

    // Body Sections
    sections.forEach((section) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc
        .fillColor('#4338CA')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(section.heading, 50, currentY);

      currentY += 22;

      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica')
        .text(section.body, 50, currentY, { width: 495, align: 'left', lineGap: 4 });

      currentY += doc.heightOfString(section.body, { width: 495, lineGap: 4 }) + 20;
    });

    // Footer
    doc
      .fontSize(8)
      .fillColor('#94A3B8')
      .text('Generated via CampusVault Repository Engine — Protected View', 50, 780, {
        align: 'center',
        width: 495,
      });

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

async function seed() {
  console.log('--- Starting CampusVault Database Seeding ---');
  await connectDB();

  // Ensure documents directory exists
  const docsDir = path.join(env.uploadDir, 'documents');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Clear existing collections
  console.log('Clearing old collections...');
  await Promise.all([
    User.deleteMany({}),
    College.deleteMany({}),
    Course.deleteMany({}),
    Branch.deleteMany({}),
    AcademicYear.deleteMany({}),
    Semester.deleteMany({}),
    Subject.deleteMany({}),
    Module.deleteMany({}),
    Resource.deleteMany({}),
    Bookmark.deleteMany({}),
    StudyProgress.deleteMany({}),
    MaterialRequest.deleteMany({}),
  ]);

  // 1. Create Academic Years
  console.log('Creating Academic Years...');
  const ay2025 = await AcademicYear.create({
    name: '2025-26',
    isCurrent: true,
  });
  const ay2024 = await AcademicYear.create({
    name: '2024-25',
    isCurrent: false,
  });

  // 2. Create Colleges
  console.log('Creating Colleges...');
  const college = await College.create({
    name: 'C.V. Raman Global University',
    code: 'CGU',
    slug: 'cgu',
    location: 'Bhubaneswar, Odisha',
    website: 'https://cgu-odisha.ac.in',
  });

  const college2 = await College.create({
    name: 'Kalinga Institute of Industrial Technology',
    code: 'KIIT',
    slug: 'kiit',
    location: 'Bhubaneswar, Odisha',
    website: 'https://kiit.ac.in',
  });

  // 3. Create Courses
  console.log('Creating Courses...');
  const courseBTech = await Course.create({
    name: 'B.Tech (Bachelor of Technology)',
    code: 'BTECH',
    slug: 'btech',
    durationYears: 4,
    college: college._id,
  });

  // 4. Create Branches
  console.log('Creating Branches...');
  const branchCSE = await Branch.create({
    name: 'Computer Science & Engineering',
    code: 'CSE',
    slug: 'cse',
    course: courseBTech._id,
    college: college._id,
  });

  const branchECE = await Branch.create({
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    slug: 'ece',
    course: courseBTech._id,
    college: college._id,
  });

  // 5. Create Semesters
  console.log('Creating Semesters...');
  for (let s = 1; s <= 8; s++) {
    await Semester.create({
      semesterNumber: s,
      branch: branchCSE._id,
      course: courseBTech._id,
      college: college._id,
      academicYear: ay2025._id,
    });
  }

  // 6. Create Users
  console.log('Creating Users...');
  const adminUser = await User.create({
    fullName: 'CampusVault Admin',
    email: 'admin@campusvault.edu',
    password: 'Admin@12345',
    role: 'ADMIN',
    college: college._id,
    course: courseBTech._id,
    branch: branchCSE._id,
    admissionYear: 2022,
    currentAcademicYear: '2025-26',
    currentSemester: 7,
  });

  const studentRahul = await User.create({
    fullName: 'Rahul Kumar',
    email: 'rahul.kumar@cgu-odisha.ac.in',
    password: 'Student@12345',
    role: 'CONTRIBUTOR',
    college: college._id,
    course: courseBTech._id,
    branch: branchCSE._id,
    admissionYear: 2025,
    currentAcademicYear: '2025-26',
    currentSemester: 3,
    contributionCount: 4,
  });

  const studentPriya = await User.create({
    fullName: 'Priya Sharma',
    email: 'priya.sharma@cgu-odisha.ac.in',
    password: 'Student@12345',
    role: 'STUDENT',
    college: college._id,
    course: courseBTech._id,
    branch: branchCSE._id,
    admissionYear: 2025,
    currentAcademicYear: '2025-26',
    currentSemester: 3,
  });

  // 7. Create Subjects for CSE Semester 3
  console.log('Creating Subjects...');
  const dbms = await Subject.create({
    name: 'Database Management Systems',
    code: 'CSE302',
    slug: 'dbms',
    semesterNumber: 3,
    branch: branchCSE._id,
    course: courseBTech._id,
    college: college._id,
    credits: 4,
    description:
      'Comprehensive study of relational models, SQL query optimization, transaction management, concurrency, and normal forms.',
  });

  const cn = await Subject.create({
    name: 'Computer Networks',
    code: 'CSE304',
    slug: 'computer-networks',
    semesterNumber: 3,
    branch: branchCSE._id,
    course: courseBTech._id,
    college: college._id,
    credits: 4,
    description:
      'Network layer architectures, OSI and TCP/IP reference stacks, routing protocols, flow control, and sockets.',
  });

  const os = await Subject.create({
    name: 'Operating Systems',
    code: 'CSE306',
    slug: 'operating-systems',
    semesterNumber: 3,
    branch: branchCSE._id,
    course: courseBTech._id,
    college: college._id,
    credits: 4,
    description:
      'Process scheduling, inter-process communication, semaphores, deadlock avoidance, memory paging, and virtual memory.',
  });

  const dm = await Subject.create({
    name: 'Discrete Mathematics',
    code: 'MTH301',
    slug: 'discrete-mathematics',
    semesterNumber: 3,
    branch: branchCSE._id,
    course: courseBTech._id,
    college: college._id,
    credits: 4,
    description:
      'Set theory, relations, propositional calculus, combinatorics, graph theory, trees, and algebraic structures.',
  });

  // 8. Create Modules for DBMS
  console.log('Creating Modules for DBMS...');
  const dbmsMod1 = await Module.create({
    moduleNumber: 1,
    title: 'Module 1: Introduction, ER Modeling & Relational Algebra',
    subject: dbms._id,
    topics: ['ER Diagram', 'Entity Sets', 'Relational Algebra', 'Relational Calculus', 'Data Models'],
  });

  const dbmsMod2 = await Module.create({
    moduleNumber: 2,
    title: 'Module 2: SQL, Constraints, Triggers & Views',
    subject: dbms._id,
    topics: ['SQL Queries', 'Nested Queries', 'Joins', 'Integrity Constraints', 'Triggers', 'Views'],
  });

  const dbmsMod3 = await Module.create({
    moduleNumber: 3,
    title: 'Module 3: Normalization & Functional Dependencies',
    subject: dbms._id,
    topics: ['Normalization', 'Functional Dependencies', '1NF', '2NF', '3NF', 'BCNF', 'Lossless Decomposition'],
  });

  const dbmsMod4 = await Module.create({
    moduleNumber: 4,
    title: 'Module 4: Transaction Management & Concurrency Control',
    subject: dbms._id,
    topics: ['ACID Properties', 'Serializability', 'Two-Phase Locking (2PL)', 'Deadlock Handling', 'Timestamp Ordering'],
  });

  // 9. Generate Sample PDF files & Resources
  console.log('Generating sample PDFs and indexing resources...');

  const sampleResourcesData = [
    {
      title: 'DBMS Mid-Sem Question Paper 2025',
      slug: 'dbms-mid-sem-2025',
      description: 'Official Mid-Semester examination paper for CSE 3rd Semester 2025. Covers Modules 1, 2, and 3.',
      fileName: 'dbms_midsem_2025.pdf',
      subject: dbms._id,
      module: dbmsMod2._id,
      materialType: 'Question Paper',
      examType: 'Mid-Sem',
      examYear: 2025,
      topicsCovered: ['ER Diagram', 'Relational Algebra', 'SQL Queries', 'Normalization', '3NF', 'BCNF'],
      viewsCount: 1284,
      uniqueViewsCount: 890,
      savesCount: 532,
      source: 'CGU Examination Cell',
      sourceType: 'Official',
      permissionStatus: 'Official',
      sections: [
        {
          heading: 'SECTION A: Conceptual & Relational Queries [15 Marks]',
          body: '1. What is the fundamental difference between relational algebra and relational calculus? Write the relational algebra expression to find names of all students enrolled in Database Systems.\n\n2. Differentiate between Theta Join and Natural Join with a schema example.\n\n3. Explain the concept of total participation and partial participation in an Entity-Relationship (ER) model with a real-world diagram.',
        },
        {
          heading: 'SECTION B: Advanced SQL & Schema Design [15 Marks]',
          body: '4. Consider Schema: Employee(emp_id, emp_name, dept_id, salary) and Department(dept_id, dept_name, location).\nWrite SQL query to find the second highest salary in each department using Window functions.\n\n5. Define ON DELETE CASCADE and describe scenarios where it must be avoided to prevent accidental cascading data loss.',
        },
        {
          heading: 'SECTION C: Functional Dependencies & Normalization [20 Marks]',
          body: '6. Consider relation R(A, B, C, D, E) with F = { A -> BC, CD -> E, B -> D, E -> A }.\n(a) Identify all candidate keys of relation R.\n(b) Determine the highest normal form of R (1NF, 2NF, 3NF, or BCNF).\n(c) Decompose R into BCNF ensuring lossless join property.',
        },
      ],
    },
    {
      title: 'DBMS End-Sem Question Paper 2024',
      slug: 'dbms-end-sem-2024',
      description: 'Complete End-Semester examination paper covering full syllabus with solutions key hints.',
      fileName: 'dbms_endsem_2024.pdf',
      subject: dbms._id,
      module: null,
      materialType: 'Question Paper',
      examType: 'End-Sem',
      examYear: 2024,
      topicsCovered: ['ER Diagram', 'SQL Queries', 'Normalization', 'ACID Properties', 'Serializability', 'Two-Phase Locking (2PL)', 'B-Trees'],
      viewsCount: 2190,
      uniqueViewsCount: 1420,
      savesCount: 780,
      source: 'CGU Academic Vault',
      sourceType: 'Official',
      permissionStatus: 'Official',
      sections: [
        {
          heading: 'SECTION 1: Relational Design & Decomposition [20 Marks]',
          body: '1. Explain why 3NF is considered a pragmatic compromise over BCNF for dependency preservation.\n2. Prove that a 2-attribute relation is always in BCNF.\n3. Discuss Armstrong axioms for functional dependencies and prove the Transitivity rule.',
        },
        {
          heading: 'SECTION 2: Concurrency Control & Recovery [20 Marks]',
          body: '4. Discuss the ACID properties of transactions. How does the Write-Ahead Logging (WAL) protocol guarantee Atomicity and Durability?\n5. Contrast Strict 2PL and Rigorous 2PL. How does Strict 2PL eliminate cascading rollbacks?\n6. Explain the Wait-Die and Wound-Wait schemes for deadlock prevention.',
        },
      ],
    },
    {
      title: 'DBMS Module 3 Complete Normalization Notes',
      slug: 'dbms-module-3-notes-normalization',
      description: 'Comprehensive handwritten & typed module notes covering Functional Dependencies, 1NF to BCNF, with 15 solved university problems.',
      fileName: 'dbms_module_3_notes.pdf',
      subject: dbms._id,
      module: dbmsMod3._id,
      materialType: 'Notes',
      examType: 'None',
      examYear: 2025,
      topicsCovered: ['Normalization', 'Functional Dependencies', '1NF', '2NF', '3NF', 'BCNF', 'Lossless Decomposition'],
      viewsCount: 1840,
      uniqueViewsCount: 1100,
      savesCount: 640,
      source: 'Rahul Kumar (CGU Topper Notes)',
      sourceType: 'Student-created',
      permissionStatus: 'Permitted',
      sections: [
        {
          heading: '1. Fundamentals of Database Normalization',
          body: 'Database normalization is the systematic approach of decomposing tables to eliminate data redundancy and undesirable anomalies (Insertion, Deletion, and Update anomalies).\n\nKey Concepts:\n- Prime Attribute: Attribute that is part of any candidate key.\n- Non-Prime Attribute: Attribute not belonging to any candidate key.',
        },
        {
          heading: '2. Normal Form Hierarchy Summary',
          body: '• 1NF: Atomic domain values, no multivalued or repeating groups.\n• 2NF: 1NF + No partial dependency (No non-prime attribute depends on a proper subset of any candidate key).\n• 3NF: 2NF + No transitive dependency (For every X -> Y, either X is a superkey or Y is a prime attribute).\n• BCNF: For every functional dependency X -> Y, X must be a superkey.',
        },
      ],
    },
    {
      title: 'DBMS Frequently Appearing Exam Questions & Answers',
      slug: 'dbms-frequently-appearing-questions',
      description: 'Curated list of repeated university questions from 2022 to 2025 categorized by module importance.',
      fileName: 'dbms_important_questions.pdf',
      subject: dbms._id,
      module: null,
      materialType: 'Important Questions',
      examType: 'None',
      examYear: 2025,
      topicsCovered: ['Normalization', 'ER Diagram', 'Relational Algebra', 'SQL Queries', 'Serializability'],
      viewsCount: 1540,
      uniqueViewsCount: 980,
      savesCount: 620,
      source: 'Department Faculty Handout',
      sourceType: 'Official',
      permissionStatus: 'Official',
      sections: [
        {
          heading: 'Top High-Frequency Exam Topics',
          body: 'Based on analysis of CGU past examination papers:\n1. BCNF Decomposition and Lossless Test (Appeared in 4 out of last 4 semesters)\n2. Conflict Serializability Precedence Graph (Appeared every End-Sem)\n3. Relational Algebra Division Operator and Group By Queries\n4. Two-Phase Locking vs Time Stamp Ordering comparison',
        },
      ],
    },
    {
      title: 'Database Case Study: E-Commerce High-Throughput Schema',
      slug: 'dbms-case-study-ecommerce',
      description: 'Industry-level case study analyzing database schema partitioning, indexing, and normalization tradeoffs in an online marketplace.',
      fileName: 'dbms_case_study_ecommerce.pdf',
      subject: dbms._id,
      module: dbmsMod4._id,
      materialType: 'Case Study',
      examType: 'None',
      examYear: 2024,
      topicsCovered: ['SQL Queries', 'Normalization', 'Indexing', 'B-Trees', 'ACID Properties'],
      viewsCount: 610,
      uniqueViewsCount: 420,
      savesCount: 190,
      source: 'Prof. S. Das Academic Case Studies',
      sourceType: 'Shared With Permission',
      permissionStatus: 'Permitted',
      sections: [
        {
          heading: 'Case Background: Flash Sale Inventory Contention',
          body: 'During peak seasonal sale events, standard relational transactions on inventory tables experience severe row-locking contention and high latency. This case analyzes how intentional de-normalization and Redis caching layers prevent checkout deadlock while preserving financial auditing integrity.',
        },
      ],
    },
    {
      title: 'Computer Networks Mid-Sem Question Paper 2025',
      slug: 'cn-mid-sem-2025',
      description: 'Mid-Sem question paper with focus on Data Link Layer, Flow Control, and IP Subnetting.',
      fileName: 'cn_midsem_2025.pdf',
      subject: cn._id,
      module: null,
      materialType: 'Question Paper',
      examType: 'Mid-Sem',
      examYear: 2025,
      topicsCovered: ['OSI Model', 'TCP/IP', 'Stop and Wait ARQ', 'Go-Back-N', 'Sliding Window', 'Subnetting'],
      viewsCount: 950,
      uniqueViewsCount: 670,
      savesCount: 340,
      source: 'CGU Academic Repository',
      sourceType: 'Official',
      permissionStatus: 'Official',
      sections: [
        {
          heading: 'Questions Overview',
          body: '1. Derive channel efficiency for Go-Back-N protocol with window size N.\n2. An organization is granted block 192.168.10.0/24. Design 4 subnets with equal host distribution.\n3. Compare CRC checksum generation with Internet 16-bit 1s complement checksum.',
        },
      ],
    },
    {
      title: 'Operating Systems Process Synchronization Lecture Notes',
      slug: 'os-process-sync-notes',
      description: 'Detailed unit notes on Critical Section Problem, Peterson Solution, Semaphores, and Monitors.',
      fileName: 'os_sync_notes.pdf',
      subject: os._id,
      module: null,
      materialType: 'Notes',
      examType: 'None',
      examYear: 2025,
      topicsCovered: ['Process Synchronization', 'Semaphores', 'Peterson Solution', 'Dining Philosophers', 'Deadlock'],
      viewsCount: 1420,
      uniqueViewsCount: 920,
      savesCount: 510,
      source: 'Student Tech Community',
      sourceType: 'Student-created',
      permissionStatus: 'Permitted',
      sections: [
        {
          heading: 'The Critical Section Problem Requirements',
          body: 'Any valid solution to the critical section problem must satisfy three essential criteria:\n1. Mutual Exclusion: If process P is executing in its critical section, no other processes can be executing.\n2. Progress: If no process is executing in its critical section and some processes wish to enter, only those processes not in their remainder sections can participate in deciding who enters next.\n3. Bounded Waiting: There must be a bound on the number of times other processes are allowed to enter their critical sections after a process has made a request.',
        },
      ],
    },
    {
      title: 'Discrete Mathematics Graph Theory Question Bank 2024',
      slug: 'dm-graph-theory-question-bank',
      description: 'Past 5 years solved university questions on Euler circuits, Hamiltonian paths, chromatic numbers, and planar graphs.',
      fileName: 'dm_graph_theory_qb.pdf',
      subject: dm._id,
      module: null,
      materialType: 'Question Bank',
      examType: 'End-Sem',
      examYear: 2024,
      topicsCovered: ['Graph Theory', 'Euler Circuits', 'Hamiltonian Cycles', 'Planar Graphs', 'Trees'],
      viewsCount: 890,
      uniqueViewsCount: 540,
      savesCount: 290,
      source: 'Department of Mathematics',
      sourceType: 'Official',
      permissionStatus: 'Official',
      sections: [
        {
          heading: 'Core Problem Sets',
          body: '1. State and prove Euler formula for connected planar graphs: V - E + F = 2.\n2. Determine whether complete bipartite graph K(3,3) is planar using Kuratowski theorem.\n3. What is the chromatic polynomial of a tree with n vertices?',
        },
      ],
    },
  ];

  for (const item of sampleResourcesData) {
    const filePath = path.join(docsDir, item.fileName);
    await generateSamplePdf(
      filePath,
      item.title,
      `${college.name} • ${branchCSE.name} • Semester 3`,
      item.sections
    );

    const stats = fs.statSync(filePath);

    const resourceDoc = await Resource.create({
      title: item.title,
      slug: item.slug,
      description: item.description,
      fileKey: item.fileName,
      storageProvider: 'local',
      fileSize: stats.size,
      pageCount: 3,
      mimeType: 'application/pdf',
      college: college._id,
      course: courseBTech._id,
      branch: branchCSE._id,
      academicYear: '2025-26',
      semesterNumber: 3,
      subject: item.subject,
      module: item.module,
      materialType: item.materialType,
      examType: item.examType,
      examYear: item.examYear,
      topicsCovered: item.topicsCovered,
      source: item.source,
      sourceType: item.sourceType,
      permissionStatus: item.permissionStatus,
      status: 'approved',
      uploadedBy: studentRahul._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      viewsCount: item.viewsCount,
      uniqueViewsCount: item.uniqueViewsCount,
      savesCount: item.savesCount,
    });

    resourceDoc.calculateTrendingScore();
    await resourceDoc.save();
  }

  // 10. Create Sample Bookmarks for Rahul
  console.log('Creating sample bookmarks...');
  const firstResource = await Resource.findOne({ slug: 'dbms-mid-sem-2025' });
  const secondResource = await Resource.findOne({ slug: 'dbms-module-3-notes-normalization' });

  if (firstResource) {
    await Bookmark.create({
      user: studentRahul._id,
      resource: firstResource._id,
    });
  }
  if (secondResource) {
    await Bookmark.create({
      user: studentRahul._id,
      resource: secondResource._id,
    });
  }

  // 11. Create Sample Study Progress
  console.log('Creating sample study progress...');
  if (firstResource) {
    await StudyProgress.create({
      user: studentRahul._id,
      resource: firstResource._id,
      subject: dbms._id,
      status: 'Studied',
      completionPercentage: 100,
    });
  }
  if (secondResource) {
    await StudyProgress.create({
      user: studentRahul._id,
      resource: secondResource._id,
      subject: dbms._id,
      status: 'In Progress',
      completionPercentage: 65,
    });
  }

  // 12. Create Sample Material Requests
  console.log('Creating sample material requests...');
  await MaterialRequest.create({
    subject: dbms._id,
    subjectName: 'Database Management Systems (CSE302)',
    requestedMaterial: '2024 Mid-Sem Question Paper with Answer Key',
    details: 'Looking for detailed solutions for Module 3 Normalization decomposition questions.',
    requestedBy: [{ user: studentRahul._id }, { user: studentPriya._id }],
    requestCount: 14,
    status: 'pending',
  });

  await MaterialRequest.create({
    subject: cn._id,
    subjectName: 'Computer Networks (CSE304)',
    requestedMaterial: 'Socket Programming Lab Manual and Solved Code',
    details: 'Need C/Python implementation of concurrent TCP chat server.',
    requestedBy: [{ user: studentPriya._id }],
    requestCount: 8,
    status: 'pending',
  });

  console.log(`
==================================================
   CAMPUSVAULT DATABASE SEEDING COMPLETED!
   -----------------------------------------
   Admin Login:
   Email:    admin@campusvault.edu
   Password: Admin@12345
   Role:     ADMIN

   Student / Contributor Login:
   Email:    rahul.kumar@cgu-odisha.ac.in
   Password: Student@12345
   Role:     CONTRIBUTOR (Rahul Kumar, CSE Sem 3)
==================================================
  `);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
