-- Notification types enum values
-- generation_complete, generation_failed, system_announcement, account_update, subscription_renewal, subscription_expiring

CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`resourceId` text,
	`isRead` integer NOT NULL DEFAULT false,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_userId_isRead_idx` ON `notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`createdAt`);