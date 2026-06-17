-- Teams and team members tables
-- Teams have an owner; members join via invite code

CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ownerId` text NOT NULL,
	`inviteCode` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_inviteCode_unique` ON `teams` (`inviteCode`);--> statement-breakpoint
CREATE INDEX `teams_ownerId_idx` ON `teams` (`ownerId`);--> statement-breakpoint
CREATE INDEX `teams_inviteCode_idx` ON `teams` (`inviteCode`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL DEFAULT 'member',
	`joinedAt` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_members_teamId_idx` ON `team_members` (`teamId`);--> statement-breakpoint
CREATE INDEX `team_members_userId_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_teamId_userId_unique_idx` ON `team_members` (`teamId`,`userId`);
