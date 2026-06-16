-- API Keys table
-- Stores hashed API keys. Full key is never stored; only SHA-256 hash.

CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`keyPrefix` text NOT NULL,
	`keyHash` text NOT NULL,
	`lastUsedAt` integer,
	`expiresAt` integer,
	`isRevoked` integer NOT NULL DEFAULT false,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_keyHash_unique` ON `api_keys` (`keyHash`);--> statement-breakpoint
CREATE INDEX `api_keys_userId_idx` ON `api_keys` (`userId`);--> statement-breakpoint
CREATE INDEX `api_keys_keyHash_idx` ON `api_keys` (`keyHash`);
