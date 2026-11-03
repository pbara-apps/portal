import { makeNotificationHooks } from "@/lib/notifications/makeNotificationHooks";
import http from ".";

/** Admin portal notifications. */
export const adminNotifications = makeNotificationHooks(http, "/notifications", "admin");
