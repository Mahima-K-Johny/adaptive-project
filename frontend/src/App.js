import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import StudentRegistration from './StudentRegistration';
import StudentDashboard from './StudentDashboard';
import ProtectedRoute from './ProtectedRoute';
import AddCourse from './AddCourse';
import Topics from "./Topics";
import AddTeacher from './AddTeacher';
import TeacherDashboard from './TeacherDashboard';
import StudentMaterials from './StudentMaterials';
import TeacherUploadQuestion from "./TeacherUploadQuestion";
import StudentExam from './StudentExam';
import StudentProgressDashboard from './StudentProgressDashboard';
import ProgressReport from './ProgressReport'; // ✅ ADD THIS IMPORT
import AdminAnalytics from './AdminAnalytics';

function App() {
  return (
    <Router>
      <Routes>

        {/* Auth */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/student-registration" element={<StudentRegistration />} />

        {/* Admin */}
        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/add-course"
          element={<ProtectedRoute><AddCourse /></ProtectedRoute>}
        />
        <Route
          path="/add-teacher"
          element={<ProtectedRoute><AddTeacher /></ProtectedRoute>}
        />
<Route
  path="/admin-analytics"
  element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>}
/>
        {/* Teacher */}
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/upload-question" element={<TeacherUploadQuestion />} />
        <Route path="/teacher/progress-report" element={<ProgressReport />} /> {/* ✅ ADD THIS */}
        <Route path="/topics" element={<Topics />} />

        {/* Student */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-exam" element={<StudentExam />} />
        <Route path="/student/materials/:subject" element={<StudentMaterials />} />
        <Route path="/student-progress" element={<StudentProgressDashboard />} />

        {/* Default — MUST be last */}
        <Route path="*" element={<Navigate to="/admin-login" />} />

      </Routes>
    </Router>
  );
}

export default App;