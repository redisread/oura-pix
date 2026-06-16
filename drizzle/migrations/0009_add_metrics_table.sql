-- Performance metrics table
-- Records Web Vitals (LCP, INP, CLS, FCP, TTFB) and navigation timings

CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`rating` text,
	`url` text,
	`userAgent` text,
	`deviceType` text,
	`connectionType` text,
	`context` text,
	`recordedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `metrics_name_idx` ON `metrics` (`name`);--> statement-breakpoint
CREATE INDEX `metrics_rating_idx` ON `metrics` (`rating`);--> statement-breakpoint
CREATE INDEX `metrics_recordedAt_idx` ON `metrics` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `metrics_name_recordedAt_idx` ON `metrics` (`name`,`recordedAt`);
