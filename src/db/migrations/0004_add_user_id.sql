-- Migration: Add userId to conversations and clean up orphaned messages
-- Step 1: Delete orphaned messages (messages that reference non-existent conversations)
DELETE FROM messages
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- Step 2: Add userId column to conversations table (nullable initially)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id text;

-- Step 3: Create index on userId for faster queries
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations USING btree (user_id);

-- Step 4: Add foreign key constraint to user table
ALTER TABLE conversations 
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
