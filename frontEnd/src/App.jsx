import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import PublicLayout from './components/common/PublicLayout'
import AuthLayout from './components/common/AuthLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import CertificateVerify from './pages/CertificateVerify'

import StudentDashboard from './pages/student/StudentDashboard'
import QualificationDetail from './pages/student/QualificationDetail'
import StudentVerifications from './pages/student/StudentVerifications'
import ErrorReports from './pages/student/ErrorReports'

import StaffDashboard from './pages/staff/StaffDashboard'
import QualificationEntry from './pages/staff/QualificationEntry'
import StaffManagement from './pages/staff/StaffManagement'

import VerifierDashboard from './pages/verifier/VerifierDashboard'
import NewRequestWizard from './pages/verifier/NewRequestWizard'
import PaymentProcessor from './pages/verifier/PaymentProcessor'
import RequestDetail from './pages/verifier/RequestDetail'

import AdminDashboard from './pages/admin/AdminDashboard'
import InstitutionApproval from './pages/admin/InstitutionApproval'
import VerifierApproval from './pages/admin/VerifierApproval'
import Analytics from './pages/admin/Analytics'
import AuditLogViewer from './pages/admin/AuditLogViewer'
import OfficialOnboarding from './pages/admin/OfficialOnboarding'
import TransactionDemo from './pages/admin/TransactionDemo'

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/verify/:certificate_number" element={<PublicLayout><CertificateVerify /></PublicLayout>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<AuthLayout><StudentDashboard /></AuthLayout>} />
          <Route path="/student/qualifications/:id" element={<AuthLayout><QualificationDetail /></AuthLayout>} />
          <Route path="/student/verifications" element={<AuthLayout><StudentVerifications /></AuthLayout>} />
          <Route path="/student/error-reports" element={<AuthLayout><ErrorReports /></AuthLayout>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<AuthLayout><StaffDashboard /></AuthLayout>} />
          <Route path="/staff/qualifications/new" element={<AuthLayout><QualificationEntry /></AuthLayout>} />
          <Route path="/staff/members" element={<AuthLayout><StaffManagement /></AuthLayout>} />

          {/* Verifier Routes */}
          <Route path="/verifier/dashboard" element={<AuthLayout><VerifierDashboard /></AuthLayout>} />
          <Route path="/verifier/requests/new" element={<AuthLayout><NewRequestWizard /></AuthLayout>} />
          <Route path="/verifier/requests/:id" element={<AuthLayout><RequestDetail /></AuthLayout>} />
          <Route path="/verifier/payment/:id" element={<AuthLayout><PaymentProcessor /></AuthLayout>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AuthLayout><AdminDashboard /></AuthLayout>} />
          <Route path="/admin/transactions" element={<AuthLayout><TransactionDemo /></AuthLayout>} />
          <Route path="/admin/institutions/pending" element={<AuthLayout><InstitutionApproval /></AuthLayout>} />
          <Route path="/admin/verifiers/pending" element={<AuthLayout><VerifierApproval /></AuthLayout>} />
          <Route path="/admin/analytics" element={<AuthLayout><Analytics /></AuthLayout>} />
          <Route path="/admin/logs" element={<AuthLayout><AuditLogViewer /></AuthLayout>} />
          <Route path="/admin/master-control-onboarding" element={<AuthLayout><OfficialOnboarding /></AuthLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
