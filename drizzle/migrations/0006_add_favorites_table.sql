CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`generationId` text NOT NULL,
	`imageUrl` text NOT NULL,
	`imageIndex` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generationId`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_userId_idx` ON `favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `favorites_userId_generationId_idx` ON `favorites` (`userId`,`generationId`);--> statement-breakpoint
CREATE INDEX `favorites_unique_idx` ON `favorites` (`userId`,`imageUrl`);