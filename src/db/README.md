# Database

This folder contains all database-related operations and utilities for Supabase integration.

## Purpose

All Supabase database calls and related functionality should be implemented in this folder to maintain a clean separation of concerns and organize database operations.

## Structure

- Place database query functions, table schemas, and data access layers here
- Use the Supabase client from `../client/supabase.ts` for all database operations
- Organize files by feature or table (e.g., `users.ts`, `posts.ts`, etc.)

## Usage Example

```typescript
import { supabase } from '../client/supabase'

// Example: User operations
export const getUser = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
```

## Best Practices

- Keep database operations atomic and well-documented
- Handle errors appropriately and provide meaningful error messages
- Use TypeScript types for better type safety
- Implement proper data validation before database operations
