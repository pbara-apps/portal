import { makeNotificationHooks } from "@/lib/notifications/makeNotificationHooks";
import chapterHttp from "./http";

/** Chapter portal notifications. */
export const chapterNotifications = makeNotificationHooks(chapterHttp, "/notifications", "chapter-portal");
