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




function App() {
  return (
    <Router>
      <Routes>

        {/* Login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Student Registration */}
        <Route
          path="/student-registration"
          element={<StudentRegistration />}
        />

        {/* Admin Dashboard (Protected) */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
 {/* add course */}
       <Route 
  path="/add-course" 
  element={
    <ProtectedRoute>
      <AddCourse />
    </ProtectedRoute>
  } 
/>
<Route path="/topics" element={<Topics />} />


{/* teacher */}
<Route
  path="/add-teacher"
  element={
    <ProtectedRoute>
      <AddTeacher />
    </ProtectedRoute>
  }
/>
<Route
  path="/student/materials/:subject"
  element={<StudentMaterials />}
/>
<Route path="/teacher-dashboard" element={<TeacherDashboard />} />

 {/* student dashboard*/}
 <Route path="/student-dashboard" element={<StudentDashboard />} />
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/admin-login" />} />



        <Route
          path="/teacher/upload-question"
          element={<TeacherUploadQuestion />}
        />

      </Routes>
    </Router>
  );
}

export default App;

