# shadcn/ui Components Setup Guide

This directory contains shadcn/ui compatible components for the Mietchecker project.

## Components Created

### 1. **button.tsx** (56 lines)
Button component with multiple variants using class-variance-authority (CVA).

**Variants:**
- `default` - Primary button style
- `destructive` - Red/danger button
- `outline` - Bordered button
- `secondary` - Secondary style
- `ghost` - Minimal style without background
- `link` - Text link style

**Sizes:**
- `default` - Regular button
- `sm` - Small button
- `lg` - Large button
- `icon` - Square icon button

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <Button>Click me</Button>
    <Button variant="destructive">Delete</Button>
    <Button variant="outline" size="sm">Small</Button>
  )
}
```

---

### 2. **card.tsx** (79 lines)
Card component with composable sub-components for flexible layouts.

**Components:**
- `Card` - Main card container
- `CardHeader` - Top section for headers
- `CardTitle` - Card title
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Usage:**
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>Content here</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  )
}
```

---

### 3. **input.tsx** (23 lines)
Input field component for form inputs.

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

export default function App() {
  return (
    <Input
      type="text"
      placeholder="Enter text..."
    />
  )
}
```

---

### 4. **label.tsx** (24 lines)
Label component using Radix UI Label primitive.

**Usage:**
```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function App() {
  return (
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" />
    </div>
  )
}
```

---

### 5. **separator.tsx** (29 lines)
Separator/divider component using Radix UI Separator primitive.

**Usage:**
```tsx
import { Separator } from "@/components/ui/separator"

export default function App() {
  return (
    <div>
      <p>Section 1</p>
      <Separator />
      <p>Section 2</p>
      <Separator orientation="vertical" />
    </div>
  )
}
```

---

### 6. **switch.tsx** (27 lines)
Toggle switch component using Radix UI Switch primitive.

**Usage:**
```tsx
import { Switch } from "@/components/ui/switch"

export default function App() {
  return (
    <Switch defaultChecked />
  )
}
```

---

### 7. **dialog.tsx** (120 lines)
Modal dialog component with composable sub-components using Radix UI Dialog.

**Components:**
- `Dialog` - Root dialog container
- `DialogTrigger` - Button/trigger element
- `DialogContent` - Dialog content wrapper
- `DialogHeader` - Header section
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description
- `DialogFooter` - Footer section
- `DialogClose` - Close button
- `DialogOverlay` - Backdrop
- `DialogPortal` - Portal container

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog content here</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 8. **toast.tsx** (122 lines)
Toast notification component using Radix UI Toast.

**Components:**
- `ToastProvider` - Root provider
- `ToastViewport` - Viewport for toasts
- `Toast` - Toast container
- `ToastTitle` - Toast title
- `ToastDescription` - Toast message
- `ToastAction` - Action button in toast
- `ToastClose` - Close button

**Variants:**
- `default` - Normal toast
- `destructive` - Error/destructive toast

**Usage:**
```tsx
"use client"

import { useState } from "react"
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Show Toast</Button>

      {open && (
        <Toast>
          <ToastTitle>Success</ToastTitle>
          <ToastDescription>Operation completed</ToastDescription>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      )}

      <ToastViewport />
    </ToastProvider>
  )
}
```

---

## Index File

An `index.ts` file is provided for convenient imports:

```tsx
// Import individual components
import { Button } from "@/components/ui"
import { Card, CardHeader } from "@/components/ui"

// Or import all from index
import * as UI from "@/components/ui"
```

---

## Dependencies

These components require the following packages to be installed:

```json
{
  "dependencies": {
    "react": "^18+",
    "class-variance-authority": "^0.7+",
    "@radix-ui/react-slot": "^2.0+",
    "@radix-ui/react-label": "^2.0+",
    "@radix-ui/react-separator": "^1.0+",
    "@radix-ui/react-switch": "^1.0+",
    "@radix-ui/react-dialog": "^1.1+",
    "@radix-ui/react-toast": "^1.1+",
    "lucide-react": "^0.294+",
    "tailwindcss": "^3+",
    "tailwind-merge": "^2.0+",
    "clsx": "^2.0+"
  }
}
```

Install missing dependencies with:
```bash
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-dialog @radix-ui/react-toast lucide-react
```

---

## Key Features

✅ **TypeScript Support** - Full type safety with proper typing
✅ **Tailwind CSS** - Styled with utility classes
✅ **Dark Mode** - Built-in dark mode support
✅ **Accessible** - WCAG compliant using Radix UI primitives
✅ **Composable** - Components are composable and flexible
✅ **Variants** - CVA for clean variant management
✅ **Forwarded Refs** - All components support ref forwarding
✅ **Customizable** - Easy to override styles with className

---

## Styling Customization

All components use the `cn()` utility from `@/lib/utils` which combines Tailwind classes with `clsx` and `tailwind-merge`.

To customize colors, update your `tailwind.config.ts`:

```ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        // etc.
      },
    },
  },
}
```

---

## File Sizes

- button.tsx: 56 lines
- card.tsx: 79 lines
- dialog.tsx: 120 lines
- input.tsx: 23 lines
- label.tsx: 24 lines
- separator.tsx: 29 lines
- switch.tsx: 27 lines
- toast.tsx: 122 lines
- **Total: 480 lines**

---

## Next Steps

1. Ensure all required dependencies are installed
2. Import components as needed in your pages/components
3. Customize colors and styling in your Tailwind config
4. Use the components throughout your application

For more information, visit:
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
