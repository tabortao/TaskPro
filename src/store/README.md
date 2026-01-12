# Store

This folder contains global state management using Zustand for cross-page state sharing.

## Purpose

Zustand is used to implement global state management that can be accessed across different pages and components in the application.

## Structure

- Create individual store files for different feature domains (e.g., `userStore.ts`, `appStore.ts`)
- Keep stores focused and modular
- Export store hooks for easy consumption in components

## Usage Example

```typescript
import { create } from 'zustand'

interface UserState {
  user: User | null
  isLoggedIn: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => set({ user: null, isLoggedIn: false }),
}))
```

## Usage in Components

```typescript
import { useUserStore } from '../store/userStore'

const Component = () => {
  const { user, isLoggedIn, setUser } = useUserStore()

  // Use state and actions as needed
  return <div>{user?.name}</div>
}
```

## Best Practices

- Keep stores simple and focused on specific domains
- Use TypeScript interfaces for better type safety
- Avoid deeply nested state structures
- Use actions to modify state rather than direct mutations
- Consider using middleware for persistence or devtools integration
