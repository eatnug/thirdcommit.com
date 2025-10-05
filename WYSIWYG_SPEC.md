# WYSIWYG Markdown Editor Specification

## Overview
Add a WYSIWYG markdown editor with side-by-side preview to the existing blog post editor.

## Core Features

### 1. Editor Component
- **Library**: `@uiw/react-md-editor`
  - Popular, lightweight, React-native
  - Built-in markdown support
  - Customizable preview rendering
- **Replace**: Current textarea at `app/editor/page.tsx:134-139`
- **Mode**: Side-by-side edit + preview with toggle options
  - Edit only
  - Preview only
  - Split view (default)

### 2. Preview Integration
- **Renderer**: Use existing `markdownToHtml()` function from `lib/markdown.ts`
- **Styling**: Match blog's final rendering
- **Sync**: Real-time preview updates

### 3. Autosave
- **Frequency**: Every 30 seconds
- **Storage**: Browser localStorage
- **Keys**:
  - `editor-autosave-{timestamp}` for content
  - `editor-autosave-meta-{timestamp}` for title/description/tags/draft
- **Restore**: On page load, check for unsaved autosave and prompt user

### 4. Version History
- **Storage**: localStorage with timestamps
- **Retention**: Last 10 versions
- **UI**: Dropdown or modal to view/restore previous versions
- **Format**:
  ```json
  {
    "timestamp": "2025-10-05T10:30:00Z",
    "title": "Post Title",
    "content": "markdown content...",
    "description": "...",
    "tags": "...",
    "draft": true
  }
  ```

### 5. Validation & UX
- **Unsaved Changes Warning**: `beforeunload` event listener
- **Required Fields**: Title and content (existing validation)
- **Paste Handling**: Accept plain text, preserve markdown syntax

## Keep Existing

### Metadata Inputs
- Title (required)
- Description (SEO, 160 char limit)
- Tags (comma-separated)
- Draft checkbox

### Backend Integration
- `/api/posts` POST endpoint
- File saving to `content/posts/`
- Filename generation (kebab-case from title)
- Frontmatter format

### Markdown Pipeline
- `marked` library for parsing
- `Shiki` for syntax highlighting
- `DOMPurify` for sanitization
- Support for existing languages: js, ts, jsx, tsx, css, html, bash, json, markdown

## Explicitly Out of Scope

### Current Phase
- Image upload/management
- Mobile responsive editing
- Custom toolbar UI
- Table visual editor
- MDX/custom components
- Collaborative editing
- Cloud sync

## Implementation Tasks

1. **Install dependencies**
   ```bash
   npm install @uiw/react-md-editor
   ```

2. **Update editor page** (`app/editor/page.tsx`)
   - Import and integrate `@uiw/react-md-editor`
   - Configure custom preview with `markdownToHtml`
   - Add view mode toggle (edit/preview/split)
   - Remove existing textarea

3. **Add autosave functionality**
   - Implement 30s interval timer
   - Save to localStorage on interval
   - Restore from localStorage on mount
   - Show autosave indicator

4. **Add version history**
   - Create version history store in localStorage
   - Add UI to view previous versions
   - Implement restore functionality
   - Limit to 10 most recent versions

5. **Add validation**
   - Implement `beforeunload` warning
   - Track dirty state (unsaved changes)
   - Prompt user when restoring autosave

## Technical Constraints

- **Development only**: Editor disabled in production (existing behavior)
- **Browser support**: Modern browsers with localStorage
- **Performance**: Debounce preview updates if needed
- **Accessibility**: Maintain keyboard navigation

## Success Criteria

- [ ] Side-by-side markdown editor with live preview
- [ ] Preview matches blog post rendering (Shiki highlighting)
- [ ] Autosave every 30s to localStorage
- [ ] Version history with restore capability
- [ ] Unsaved changes warning before page exit
- [ ] All existing functionality preserved (metadata, save API, etc.)
- [ ] No toolbar or mobile support needed
- [ ] Clean, minimal UI focused on writing
