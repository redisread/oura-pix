-- Collections table for organizing favorites

CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL DEFAULT '#3b82f6',
	`description` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collections_userId_idx` ON `collections` (`userId`);--> statement-breakpoint
ALTER TABLE `favorites` ADD `collectionId` text REFERENCES collections(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `favorites_collectionId_idx` ON `favorites` (`collectionId`);
