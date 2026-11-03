import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RouteErrorPage } from "@/components/RouteErrorPage";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { ChapterShell } from "@/features/chapter/components/ChapterShell";
import { AdminLayout } from "./layouts/AdminLayout";
import { GuestGuard } from "./layouts/GuestGuard";

const LoginPage = lazy(() => import("./auth/LoginPage"));
const DashboardPage = lazy(() => import("./admin/DashboardPage"));
const ExecutivePage = lazy(() => import("./admin/ExecutivePage"));
const OfficePage = lazy(() => import("./admin/OfficePage"));
const ChapterPage = lazy(() => import("./admin/ChapterPage"));
const RankPage = lazy(() => import("./admin/RankPage"));
const ChaptersPage = lazy(() => import("./admin/ChaptersPage"));
const RecruitmentPage = lazy(() => import("./admin/RecruitmentPage"));
const PatronPage = lazy(() => import("./admin/PatronPage"));
const NewsPage = lazy(() => import("./admin/NewsPage"));
const EventPage = lazy(() => import("./admin/EventPage"));
const GalleryPage = lazy(() => import("./admin/GalleryPage"));
const ProgramPage = lazy(() => import("./admin/ProgramPage"));
const RegistrationPage = lazy(() => import("./admin/RegistrationPage"));
const AdministrativePage = lazy(() => import("./admin/AdministrativePage"));
const MessagesPage = lazy(() => import("./admin/MessagesPage"));
const SubscribersPage = lazy(() => import("./admin/SubscribersPage"));
const ProfilePage = lazy(() => import("./admin/ProfilePage"));
const AuditPage = lazy(() => import("./admin/AuditPage"));
const SettingsPage = lazy(() => import("./admin/SettingsPage"));
// Chapter portal (counsellors, presidents, secretaries)
const ChapterLoginPage = lazy(() => import("../features/chapter/pages/ChapterLoginPage"));
const ChapterDashboardPage = lazy(() => import("../features/chapter/pages/ChapterDashboardPage"));
const ChapterMembersPage = lazy(() => import("../features/chapter/pages/ChapterMembersPage"));
const AddMembersPage = lazy(() => import("../features/chapter/pages/AddMembersPage"));
const ChapterOfficersPage = lazy(() => import("../features/chapter/pages/ChapterOfficersPage"));
const ChurchChaptersPage = lazy(() => import("../features/chapter/pages/ChurchChaptersPage"));
const ChangePasswordPage = lazy(() => import("../features/chapter/pages/ChangePasswordPage"));
const MemberHomePage = lazy(
  () => import("../features/member/pages/MemberHomePage"),
);

function AppRoot() {
  return (
    <>
      <Outlet />
      <SessionExpiredModal />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppRoot />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/login",
        element: (
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        ),
      },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "executive", element: <ExecutivePage /> },
          { path: "office", element: <OfficePage /> },
          { path: "chapter", element: <ChapterPage /> },
          { path: "ranks", element: <RankPage /> },
          { path: "recruitment", element: <RecruitmentPage /> },
          { path: "chapters", element: <ChaptersPage /> },
          { path: "patron", element: <PatronPage /> },
          { path: "news", element: <NewsPage /> },
          { path: "event", element: <EventPage /> },
          { path: "gallery", element: <GalleryPage /> },
          { path: "programs", element: <ProgramPage /> },
          { path: "registrations", element: <RegistrationPage /> },
          { path: "administrative", element: <AdministrativePage /> },
          { path: "messages", element: <MessagesPage /> },
          { path: "subscribers", element: <SubscribersPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "audit", element: <AuditPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
      { path: "/chapter/login", element: <ChapterLoginPage /> },
      {
        path: "/chapter",
        element: <ChapterShell />,
        children: [
          { index: true, element: <ChapterDashboardPage /> },
          { path: "members", element: <ChapterMembersPage /> },
          { path: "members/add", element: <AddMembersPage /> },
          { path: "officers", element: <ChapterOfficersPage /> },
          { path: "chapters", element: <ChurchChaptersPage /> },
          { path: "change-password", element: <ChangePasswordPage /> },
        ],
      },
      {
        path: "/member",
        children: [
          {
            index: true,
            element: <MemberHomePage />,
          },
        ],
      },
      { path: "/", element: <Navigate to="/admin" replace /> },
      { path: "*", element: <Navigate to="/admin" replace /> },
    ],
  },
]);
