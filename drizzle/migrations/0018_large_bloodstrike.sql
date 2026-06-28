CREATE TABLE `questionnaires` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `questionnaires_type_idx` ON `questionnaires` (`type`);--> statement-breakpoint
CREATE INDEX `questionnaires_isActive_idx` ON `questionnaires` (`is_active`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`questionnaire_id` text NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`options` text DEFAULT '[]',
	`is_required` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `questions_questionnaireId_idx` ON `questions` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `questions_questionnaireId_sortOrder_idx` ON `questions` (`questionnaire_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `user_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`questionnaire_id` text NOT NULL,
	`generation_id` text,
	`responses` text DEFAULT '{}' NOT NULL,
	`completed_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generation_id`) REFERENCES `generations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_responses_userId_idx` ON `user_responses` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_responses_questionnaireId_idx` ON `user_responses` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `user_responses_generationId_idx` ON `user_responses` (`generation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_responses_unique_idx` ON `user_responses` (`user_id`,`questionnaire_id`,`generation_id`);