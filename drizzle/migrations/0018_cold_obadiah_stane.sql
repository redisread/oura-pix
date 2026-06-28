CREATE TABLE `survey_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`surveyId` text NOT NULL,
	`question` text NOT NULL,
	`questionType` text NOT NULL,
	`options` text DEFAULT '[]',
	`required` integer DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_questions_surveyId_idx` ON `survey_questions` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_questions_surveyId_sortOrder_idx` ON `survey_questions` (`surveyId`,`sortOrder`);--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`surveyId` text NOT NULL,
	`generationId` text,
	`answers` text DEFAULT '{}' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generationId`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `survey_responses_userId_idx` ON `survey_responses` (`userId`);--> statement-breakpoint
CREATE INDEX `survey_responses_surveyId_idx` ON `survey_responses` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_responses_generationId_idx` ON `survey_responses` (`generationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `survey_responses_unique_idx` ON `survey_responses` (`userId`,`surveyId`,`generationId`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`surveyType` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `surveys_surveyType_idx` ON `surveys` (`surveyType`);--> statement-breakpoint
CREATE INDEX `surveys_status_idx` ON `surveys` (`status`);