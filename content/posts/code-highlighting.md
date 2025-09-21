---
title: Beautiful Code Syntax Highlighting
date: 2025-01-19
tags: [code, typescript, javascript, css]
description: Showcasing code syntax highlighting with Shiki in multiple programming languages
---

# Beautiful Code Syntax Highlighting

This blog uses [Shiki](https://shiki.style/) for VS Code-quality syntax highlighting. Here are some examples:

## TypeScript

```typescript
interface User {
  id: number
  name: string
  email: string
  roles: string[]
}

async function fetchUser(id: number): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) throw new Error('User not found')
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}
```

## React Component

```tsx
import { useState, useEffect } from 'react'

export function Counter({ initialValue = 0 }: { initialValue?: number }) {
  const [count, setCount] = useState(initialValue)

  useEffect(() => {
    console.log(`Count changed to: ${count}`)
  }, [count])

  return (
    <div className="counter">
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}
```

## CSS

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #e0e0e0;
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
  }
}
```

## JSON Configuration

```json
{
  "name": "my-blog",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "next build && touch out/.nojekyll"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0"
  }
}
```

All syntax highlighting automatically switches between light and dark themes!