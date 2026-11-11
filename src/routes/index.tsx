import { lazy } from "react";
import { RouterProvider as AriaRouterProvider } from "react-aria-components";
import { createBrowserRouter, Navigate, Outlet, useHref, useNavigate, useParams } from "react-router-dom";
import { RouteErrorPage } from "@/components/RouteErrorPage";
import { SessionExpiredModal } from "@/components/SessionExpiredModal";
import { ChapterShell } from "@/features/chapter/components/ChapterShell";
import { AdminLayout } from "./layouts/AdminLayout";
import { GuestGuard } from "./layouts/GuestGuard";

const LoginPage = lazy(() => import("./auth/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./auth/ResetPasswordPage"));
const FirstPasswordPage = lazy(() => import("./auth/FirstPasswordPage"));
const ChooseAreaPage = lazy(() => import("./auth/ChooseAreaPage"));
const DashboardPage = lazy(() => import("./admin/DashboardPage"));
const ExecutivePage = lazy(() => import("./admin/ExecutivePage"));
const OfficePage = lazy(() => import("./admin/OfficePage"));
const ChapterPage = lazy(() => import("./admin/ChapterPage"));
const RankPage = lazy(() => import("./admin/RankPage"));
const AdminAnnouncementsPage = lazy(() => import("./admin/AnnouncementsPage"));
const ActivityPage = lazy(() => import("./admin/ActivityPage"));
const AdminTransfersPage = lazy(() => import("./admin/TransfersPage"));
const AdminDuesPage = lazy(() => import("./admin/DuesPage"));
const MembersPage = lazy(() => import("./admin/MembersPage"));
const AchievementsAdminPage = lazy(() => import("./admin/AchievementsPage"));
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
const AccountsPage = lazy(() => import("./admin/AccountsPage"));
// Chapter portal (counsellors, presidents, secretaries)
const ChapterDashboardPage = lazy(() => import("../features/chapter/pages/ChapterDashboardPage"));
const ChapterMembersPage = lazy(() => import("../features/chapter/pages/ChapterMembersPage"));
const ChapterOfficersPage = lazy(() => import("../features/chapter/pages/ChapterOfficersPage"));
const ProgramsPage = lazy(() => import("../features/chapter/pages/ProgramsPage"));
const ChapterAchievementsPage = lazy(() => import("../features/chapter/pages/AchievementsPage"));
const ChapterTransfersPage = lazy(() => import("../features/chapter/pages/TransfersPage"));
const ChapterAnnouncementsPage = lazy(() => import("../features/chapter/pages/AnnouncementsPage"));
const MeetingsPage = lazy(() => import("../features/chapter/pages/MeetingsPage"));
const CensusPage = lazy(() => import("../features/chapter/pages/CensusPage"));
const ChapterDuesPage = lazy(() => import("../features/chapter/pages/DuesPage"));
const ChurchChaptersPage = lazy(() => import("../features/chapter/pages/ChurchChaptersPage"));
const ChangePasswordPage = lazy(() => import("../features/chapter/pages/ChangePasswordPage"));
const MemberHomePage = lazy(
  () => import("../features/member/pages/MemberHomePage"),
);

/** Old member page links open the member drawer on Members. */
function MemberDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/chapter/members?member=${id}`} replace />;
}

/** Old "register for program" links open the registration drawer on Programs. */
function ProgramRegisterRedirect() {
  const { id } = useParams();
  return <Navigate to={`/chapter/programs?register=${id ?? ""}`} replace />;
}

/** Root layout. Lets HeroUI/React Aria links and menu items navigate client-side. */
function AppRoot() {
  const navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <Outlet />
      <SessionExpiredModal />
    </AriaRouterProvider>
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
          { path: "achievements", element: <AchievementsAdminPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "dues", element: <AdminDuesPage /> },
          { path: "transfers", element: <AdminTransfersPage /> },
          { path: "announcements", element: <AdminAnnouncementsPage /> },
          { path: "activity", element: <ActivityPage /> },
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
          { path: "accounts", element: <AccountsPage /> },
        ],
      },
      {
        path: "/forgot-password",
        element: (
          <GuestGuard>
            <ForgotPasswordPage />
          </GuestGuard>
        ),
      },
      {
        path: "/reset-password",
        element: (
          <GuestGuard>
            <ResetPasswordPage />
          </GuestGuard>
        ),
      },
      // Everyone signs in on /login now; keep old chapter links working.
      { path: "/chapter/login", element: <Navigate to="/login" replace /> },
      { path: "/change-password", element: <FirstPasswordPage /> },
      { path: "/choose", element: <ChooseAreaPage /> },
      {
        path: "/chapter",
        element: <ChapterShell />,
        children: [
          { index: true, element: <ChapterDashboardPage /> },
          { path: "members", element: <ChapterMembersPage /> },
          // Adding, viewing members and registering for programs now happen in drawers.
          { path: "members/add", element: <Navigate to="/chapter/members?add=1" replace /> },
          { path: "members/:id", element: <MemberDetailRedirect /> },
          { path: "officers", element: <ChapterOfficersPage /> },
          { path: "chapters", element: <ChurchChaptersPage /> },
          { path: "programs", element: <ProgramsPage /> },
          { path: "achievements", element: <ChapterAchievementsPage /> },
          { path: "dues", element: <ChapterDuesPage /> },
          { path: "announcements", element: <ChapterAnnouncementsPage /> },
          { path: "meetings", element: <MeetingsPage /> },
          { path: "census", element: <CensusPage /> },
          { path: "transfers", element: <ChapterTransfersPage /> },
          { path: "programs/:id/register", element: <ProgramRegisterRedirect /> },
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
