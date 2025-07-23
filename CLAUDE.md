# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Clarity Matrix" - a Korean GTD (Getting Things Done) web application that implements the GTD methodology combined with the Eisenhower Matrix for task prioritization. The project is currently in the design/prototype phase with static HTML files demonstrating the user interface.

## Project Structure

```
gtd_web_claude/
├── GTD 기반 일정 관리 서비스_.md  # Detailed project specification document
└── design/                        # HTML prototypes/mockups
    ├── main.html                  # Main dashboard
    ├── inbox.html                 # Task capture/inbox
    ├── today.html                 # Today's tasks view
    ├── projects.html              # Project management
    ├── eisenhower_matrix.html     # Priority matrix view
    ├── completed.html             # Completed tasks
    └── settings.html              # Application settings
```

## Technology Stack

**Current State**: Static HTML prototypes
- HTML files with Korean localization
- References to missing CSS (`../assets/css/style.css`) 
- References to missing JavaScript (`../assets/js/app.js`)
- No build system, package management, or backend currently exists

**Future Implementation** (from specification):
- Frontend: React/React Native or Vue/NativeScript
- Backend: Node.js/Express, Python/Django, or Go
- Database: PostgreSQL + Redis
- Real-time sync: WebSocket-based architecture

## Core Features (Based on HTML Prototypes)

1. **수신함 (Inbox)**: Task capture with Eisenhower Matrix quadrant assignment
2. **오늘 (Today)**: Daily task view
3. **프로젝트 (Projects)**: Hierarchical project and task management
4. **아이젠하워 매트릭스 (Eisenhower Matrix)**: Interactive priority matrix with 4 quadrants:
   - Q1: 긴급 & 중요 (Urgent & Important)
   - Q2: 긴급하지 않음 & 중요 (Not Urgent & Important)  
   - Q3: 긴급 & 중요하지 않음 (Urgent & Not Important)
   - Q4: 긴급하지 않음 & 중요하지 않음 (Not Urgent & Not Important)
5. **완료 (Completed)**: Completed tasks archive
6. **설정 (Settings)**: Application configuration

## Development Commands

**Note**: No build system currently exists. The project consists only of static HTML files.

To set up development:
1. Create the missing directory structure:
   ```bash
   mkdir -p assets/css assets/js
   ```
2. Implement the missing CSS and JavaScript files referenced in HTML
3. Set up a local web server to serve the static files
4. Consider implementing a build system (webpack, vite, etc.) for future development

## Key Implementation Notes

- All UI text is in Korean
- The application follows GTD methodology principles
- Eisenhower Matrix integration is a core differentiator
- HTML prototypes show a single-page application structure with navigation
- Missing assets need to be created: `style.css` and `app.js`
- Form handling and task management logic needs JavaScript implementation

## Development Approach

When implementing features:
1. Start with the missing CSS and JavaScript files to make prototypes functional
2. Follow the detailed specification in `GTD 기반 일정 관리 서비스_.md`
3. Maintain Korean localization throughout
4. Focus on GTD workflow: Capture → Clarify → Organize → Reflect → Engage
5. Ensure Eisenhower Matrix provides interactive task prioritization
6. Plan for real-time synchronization across devices in future iterations