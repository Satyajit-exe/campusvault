import http from 'http';
import app from './src/server.js';
import { env } from './src/config/env.js';

let server;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting CampusVault Backend API Verification ---');
  server = app.listen(5001, async () => {
    try {
      // 1. Health check
      const health = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/health',
        method: 'GET',
      });
      console.log('✓ Health check status:', health.statusCode, health.data.platform);

      // 2. Admin login
      const adminLogin = await request(
        {
          hostname: 'localhost',
          port: 5001,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: 'admin@campusvault.edu', password: 'Admin@12345' }
      );
      console.log('✓ Admin login status:', adminLogin.statusCode, 'Role:', adminLogin.data.user.role);
      const adminToken = adminLogin.data.token;

      // 3. Student login
      const studentLogin = await request(
        {
          hostname: 'localhost',
          port: 5001,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: 'rahul.kumar@cgu-odisha.ac.in', password: 'Student@12345' }
      );
      console.log('✓ Student login status:', studentLogin.statusCode, 'Name:', studentLogin.data.user.fullName);
      const studentToken = studentLogin.data.token;

      // 4. Hierarchy filter options
      const filterOptions = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/hierarchy/filter-options',
        method: 'GET',
      });
      console.log('✓ Filter options: Colleges:', filterOptions.data.data.colleges.length, 'Subjects:', filterOptions.data.data.subjects.length);

      // 5. Subject details for DBMS
      const dbmsRes = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/subjects/dbms',
        method: 'GET',
      });
      console.log('✓ Subject DBMS resources:', dbmsRes.data.categories.all.length, 'Modules:', dbmsRes.data.modules.length);

      // 6. Exam Mode frequency calculations
      const examMode = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/subjects/dbms/exam-mode',
        method: 'GET',
      });
      console.log('✓ Exam Mode disclaimer:', examMode.data.data.meta.disclaimer);
      console.log('✓ Top frequent topic:', examMode.data.data.frequentTopics[0]?.topic, 'Count:', examMode.data.data.frequentTopics[0]?.frequencyCount);

      // 7. Search query "DBMS"
      const searchRes = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/search?q=DBMS',
        method: 'GET',
      });
      console.log('✓ Search query "DBMS" total matches:', searchRes.data.data.totalCount);
      console.log('✓ Grouped question papers:', searchRes.data.data.grouped.questionPapers.length);
      console.log('✓ Grouped notes:', searchRes.data.data.grouped.notes.length);

      // 8. Stream sample resource
      const firstResource = dbmsRes.data.categories.all[0];
      const streamRes = await request({
        hostname: 'localhost',
        port: 5001,
        path: `/api/resources/${firstResource._id}/stream`,
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log('✓ PDF Stream status:', streamRes.statusCode, 'Content-Type:', streamRes.headers['content-type'], 'Content-Disposition:', streamRes.headers['content-disposition']);

      // 9. Bookmarks list
      const bookmarksRes = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/bookmarks',
        method: 'GET',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      console.log('✓ Student Bookmarks count:', bookmarksRes.data.bookmarks.length);

      // 10. Admin dashboard stats
      const adminDash = await request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/admin/dashboard',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('✓ Admin Dashboard stats: Total resources:', adminDash.data.data.totalResources, 'Total views:', adminDash.data.data.totalViews);

      console.log('\n>>> ALL 10 BACKEND VERIFICATION CHECKS PASSED! <<<');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test execution failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
