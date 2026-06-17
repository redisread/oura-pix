-- Competitors table
-- Manual tracking of competitor products for reference

CREATE TABLE `competitors` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`platform` text NOT NULL DEFAULT 'other',
	`url` text NOT NULL,
	`screenshots` text NOT NULL DEFAULT '[]',
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `competitors_userId_idx` ON `competitors` (`userId`);--> statement-breakpoint
CREATE INDEX `competitors_platform_idx` ON `competitors` (`platform`);--> statement-breakpoint
CREATE INDEX `competitors_createdAt_idx` ON `competitors` (`createdAt`);
