import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import MainLayout from './components/MainLayout';
import SeekageHome from './pages/Seekage/SeekageHome';
import GroupPage from './pages/Group/GroupPage';
import SubjectPage from './pages/Group/SubjectPage';
import UploadPage from './pages/Group/UploadPage';
import QAPage from './pages/Group/QAPage';
import ChatPage from './pages/Group/ChatPage';
import MeetingsPage from './pages/Group/MeetingsPage';
import SchoolHome from './pages/School/SchoolHome';
import ParentSettings from './pages/Admin/ParentSettings';

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const home = user.portal === 'school' ? '/school' : '/seekage';

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to={home} replace />} />

        <Route path="seekage" element={<SeekageHome />} />
        <Route path="school" element={<SchoolHome />} />

        <Route path="group/:groupId" element={<GroupPage />} />
        <Route path="group/:groupId/subject/:subjectId" element={<SubjectPage />} />
        <Route path="group/:groupId/subject/:subjectId/upload" element={<UploadPage />} />
        <Route path="group/:groupId/subject/:subjectId/qa" element={<QAPage />} />
        <Route path="group/:groupId/subject/:subjectId/chat" element={<ChatPage />} />
        <Route path="group/:groupId/subject/:subjectId/meetings" element={<MeetingsPage />} />

        <Route path="admin/parent-passwords" element={<ParentSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
