import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RouteErrorPage } from "@/components/RouteErrorPage";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { AdminLayout } from "./layouts/AdminLayout";
import { GuestGuard } from "./layouts/GuestGuard";

const LoginPage = lazy(() => import("./auth/LoginPage"));
const DashboardPage = lazy(() => import("./admin/DashboardPage"));
const ExecutivePage = lazy(() => import("./admin/ExecutivePage"));
const OfficePage = lazy(() => import("./admin/OfficePage"));
const ChapterPage = lazy(() => import("./admin/ChapterPage"));
const PatronPage = lazy(() => import("./admin/PatronPage"));
const NewsPage = lazy(() => import("./admin/NewsPage"));
const EventPage = lazy(() => import("./admin/EventPage"));
const GalleryPage = lazy(() => import("./admin/GalleryPage"));
const ProgramPage = lazy(() => import("./admin/ProgramPage"));
const RegistrationPage = lazy(() => import("./admin/RegistrationPage"));
const AdministrativePage = lazy(() => import("./admin/AdministrativePage"));
const MessagesPage = lazy(() => import("./admin/MessagesPage"));
const ProfilePage = lazy(() => import("./admin/ProfilePage"));
const AuditPage = lazy(() => import("./admin/AuditPage"));
const SettingsPage = lazy(() => import("./admin/SettingsPage"));
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
          { path: "patron", element: <PatronPage /> },
          { path: "news", element: <NewsPage /> },
          { path: "event", element: <EventPage /> },
          { path: "gallery", element: <GalleryPage /> },
          { path: "programs", element: <ProgramPage /> },
          { path: "registrations", element: <RegistrationPage /> },
          { path: "administrative", element: <AdministrativePage /> },
          { path: "messages", element: <MessagesPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "audit", element: <AuditPage /> },
          { path: "settings", element: <SettingsPage /> },
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
