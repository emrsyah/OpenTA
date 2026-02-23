CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" text NOT NULL,
	"title" text NOT NULL,
	"is_incognito" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sources" jsonb,
	"search_query" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversations_created_at_idx" ON "conversations" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "conversations_uuid_idx" ON "conversations" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");