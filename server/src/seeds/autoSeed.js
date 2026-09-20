import { College } from '../models/College.js';
import { Course } from '../models/Course.js';
import { Branch } from '../models/Branch.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { Semester } from '../models/Semester.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { SystemSetting } from '../models/SystemSetting.js';

export async function autoSeedIfEmpty() {
  try {
    // 1. Reset maintenance mode to OFF on server boot unless explicitly enabled via env
    if (process.env.MAINTENANCE_MODE !== 'true') {
      await SystemSetting.findOneAndUpdate(
        { key: 'maintenance_mode' },
        { value: { enabled: false } },
        { upsert: true }
      );
    }

    // 2. Ensure admin account is active
    const adminUser = await User.findOne({ email: 'admin@campusvault.edu' });
    if (adminUser) {
      adminUser.isActive = true;
      adminUser.role = 'ADMIN';
      await adminUser.save();
    }

    const collegeCount = await College.countDocuments();
    if (collegeCount > 0) {
      return;
    }

    console.log('⚡ [CampusVault] Empty database detected. Auto-seeding initial colleges, branches, and curriculum...');

    // 1. Academic Year
    await AcademicYear.create({ name: '2025-26', isCurrent: true });

    // 2. Colleges
    const college = await College.create({
      name: 'C.V. Raman Global University',
      code: 'CGU',
      slug: 'cgu',
      location: 'Bhubaneswar, Odisha',
      website: 'https://cgu-odisha.ac.in',
    });

    // 3. Course
    const course = await Course.create({
      name: 'B.Tech (Bachelor of Technology)',
      code: 'BTECH',
      slug: 'btech',
      durationYears: 4,
      college: college._id,
    });

    // 4. Branches
    const branchCSE = await Branch.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      slug: 'cse',
      course: course._id,
      college: college._id,
    });

    const branchECE = await Branch.create({
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      slug: 'ece',
      course: course._id,
      college: college._id,
    });

    const branchME = await Branch.create({
      name: 'Mechanical Engineering',
      code: 'ME',
      slug: 'me',
      course: course._id,
      college: college._id,
    });

    const branchEE = await Branch.create({
      name: 'Electrical Engineering',
      code: 'EE',
      slug: 'ee',
      course: course._id,
      college: college._id,
    });

    // 5. Semesters
    for (const b of [branchCSE, branchECE, branchME, branchEE]) {
      for (let s = 1; s <= 8; s++) {
        await Semester.create({
          semesterNumber: s,
          branch: b._id,
          course: course._id,
          college: college._id,
        });
      }
    }

    // 6. Default Subjects for CSE (covering Sem 1, 2, 3)
    const initialSubjects = [
      { name: 'Basic Electrical Engineering', code: 'EE100', slug: 'ee100', semesterNumber: 1, credits: 4 },
      { name: 'Mathematics I', code: 'MA101', slug: 'ma101', semesterNumber: 1, credits: 4 },
      { name: 'Programming in C', code: 'CS101', slug: 'cs101', semesterNumber: 1, credits: 4 },
      { name: 'Engineering Physics', code: 'PH101', slug: 'ph101', semesterNumber: 1, credits: 4 },
      { name: 'Data Structures & Algorithms', code: 'CS102', slug: 'cs102', semesterNumber: 2, credits: 4 },
      { name: 'Basic Electronics Engineering', code: 'EC101', slug: 'ec101', semesterNumber: 2, credits: 3 },
      { name: 'Mathematics II', code: 'MA102', slug: 'ma102', semesterNumber: 2, credits: 4 },
      { name: 'CAD and Graphics', code: 'ME181', slug: 'me181', semesterNumber: 2, credits: 3 },
      { name: 'Database Management Systems', code: 'CSE302', slug: 'cse302', semesterNumber: 3, credits: 4 },
      { name: 'Computer Networks', code: 'CSE304', slug: 'cse304', semesterNumber: 3, credits: 4 },
      { name: 'Discrete Mathematics', code: 'MTH301', slug: 'mth301', semesterNumber: 3, credits: 4 },
    ];

    for (const sub of initialSubjects) {
      await Subject.create({
        ...sub,
        branch: branchCSE._id,
        course: course._id,
        college: college._id,
        isActive: true,
      });
    }

    // 7. Initial Admin Account
    await User.create({
      fullName: 'CampusVault Administrator',
      email: 'admin@campusvault.edu',
      password: 'Admin@12345',
      role: 'ADMIN',
      college: college._id,
      course: course._id,
      branch: branchCSE._id,
      admissionYear: 2022,
      currentAcademicYear: '2025-26',
      currentSemester: 7,
      isActive: true,
    });

    console.log('✅ [CampusVault] Auto-seed complete! Colleges, courses, branches, and admin ready.');
  } catch (err) {
    console.error('⚠️ [CampusVault] Auto-seed non-fatal warning:', err.message);
  }
}
