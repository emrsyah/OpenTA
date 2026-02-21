# Conversation UUID Migration

## What Changed

The frontend now uses **UUID strings** (from `nanoid()`) for conversation IDs in URLs, while the database still uses **integer IDs**.

## Database Schema Update

The `conversations` table now has a `uuid` column:

```sql
ALTER TABLE conversations ADD COLUMN uuid TEXT NOT NULL UNIQUE;
CREATE INDEX conversations_uuid_idx ON conversations(uuid);
```

## How It Works

### Frontend Flow
1. Home page generates UUID: `const conversationId = nanoid()`
2. Redirects to `/{conversationId}?q={message}`
3. Chat page uses this UUID for everything

### Backend Flow
1. Receives message with `conversation_id` (UUID string)
2. Creates conversation row with that UUID (backend needs to handle this)
3. Processes message and streams response
4. Frontend updates sidebar when conversation appears in DB

### API Routes
- All API routes now support **both integer ID and UUID**:
  - `GET /api/conversations/{id}` - works with `123` or `uuid-string`
  - `GET /api/conversations/{id}/messages` - works with `123` or `uuid-string`
  - `DELETE /api/conversations/{id}` - works with `123` or `uuid-string`

## Frontend Components

### Home Page (`src/app/page.tsx`)
- Generates UUID locally
- No API calls
- Direct redirect to chat page

### Chat Page (`src/app/[id]/page.tsx`)
- Receives UUID from URL
- Passes to ChatProvider
- Handles all streaming logic

### Sidebar (`src/components/app-sidebar.tsx`)
- Links use `conversation.uuid` for navigation
- Delete uses `conversation.id` (integer)

## What Backend Needs to Do

When creating a conversation:
```python
# Backend should receive the UUID from frontend
conversation_uuid = request.json.get("conversation_id")  # Frontend generated this

# Create DB row with both integer ID (auto) and UUID
conversation = db.insert(Conversation, {
    "uuid": conversation_uuid,
    "title": "New Chat",  # Will be updated when first message is processed
    ...
})

# Use this UUID for all future requests in this conversation
```

## Migration Needed

Run this SQL to add the UUID column:

```sql
-- Add UUID column to existing conversations table
ALTER TABLE conversations ADD COLUMN uuid TEXT NOT NULL UNIQUE;

-- For existing conversations, generate UUIDs
UPDATE conversations SET uuid = 'conv-' || id::text WHERE uuid IS NULL;

-- Create index for fast lookups
CREATE INDEX conversations_uuid_idx ON conversations(uuid);
```

After migration, update the backend to:
1. Accept `conversation_id` (UUID string) from frontend
2. Store it in the `uuid` column
3. Use `uuid` for lookups when provided
