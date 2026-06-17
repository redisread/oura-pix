-- Categories and templates tables

CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`bestPractices` text,
	`sortOrder` integer NOT NULL DEFAULT 0,
	`createdAt` integer NOT NULL
);

--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`categoryId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`settings` text NOT NULL DEFAULT '{}',
	`isPreset` integer NOT NULL DEFAULT false,
	`createdBy` text,
	`usageCount` integer NOT NULL DEFAULT 0,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `templates_categoryId_idx` ON `templates` (`categoryId`);--> statement-breakpoint
CREATE INDEX `templates_isPreset_idx` ON `templates` (`isPreset`);--> statement-breakpoint
CREATE INDEX `templates_createdBy_idx` ON `templates` (`createdBy`);
