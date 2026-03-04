CREATE INDEX `generations_userId_createdAt_idx` ON `generations` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `generations_userId_status_idx` ON `generations` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `images_userId_isDeleted_idx` ON `images` (`userId`,`isDeleted`);
