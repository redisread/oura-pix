-- Error severity: critical, high, medium, low
-- Error type: network, validation, authentication, business_logic, runtime, unknown
-- Error module: api, frontend, worker, database

CREATE TABLE `errors` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`severity` text NOT NULL DEFAULT 'medium',
	`type` text NOT NULL DEFAULT 'unknown',
	`module` text NOT NULL DEFAULT 'frontend',
	`context` text,
	`hash` text NOT NULL,
	`occurrences` integer NOT NULL DEFAULT 1,
	`lastSeenAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `errors_hash_idx` ON `errors` (`hash`);--> statement-breakpoint
CREATE INDEX `errors_severity_idx` ON `errors` (`severity`);--> statement-breakpoint
CREATE INDEX `errors_type_idx` ON `errors` (`type`);--> statement-breakpoint
CREATE INDEX `errors_module_idx` ON `errors` (`module`);--> statement-breakpoint
CREATE INDEX `errors_lastSeenAt_idx` ON `errors` (`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `errors_createdAt_idx` ON `errors` (`createdAt`);
