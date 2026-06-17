-- Feedback table
-- User ratings (1-5) and comments for individual generations

CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`generationId` text NOT NULL,
	`userId` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`generationId`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feedback_generationId_idx` ON `feedback` (`generationId`);--> statement-breakpoint
CREATE INDEX `feedback_userId_idx` ON `feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `feedback_rating_idx` ON `feedback` (`rating`);
