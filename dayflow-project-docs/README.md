# Dayflow — Human Resource Management System

> Every workday, perfectly aligned.

Dayflow is a hackathon MVP for managing employees, attendance, time off, HR approvals, and salary/payroll visibility.

## Hackathon constraint

This project is being built by a 4-person team in approximately 8 hours.

Priority:
1. Working end-to-end workflows
2. Correct role-based access
3. Clean, consistent UI
4. Reliable demo
5. Speed over overengineering

## Core roles

- **Admin / HR Officer** — manages employees, attendance, time off approvals and payroll/salary administration.
- **Employee** — manages permitted profile information, attendance, time off and read-only payroll information.

## Recommended stack

- React/Next.js frontend
- Tailwind CSS + shadcn/ui or equivalent
- Supabase Auth + PostgreSQL
- Recharts or equivalent for basic analytics
- GitHub
- Vercel or equivalent deployment

## AI tools

- **Antigravity:** primary coding and integration environment
- **Claude:** deep coding, debugging, refactoring and architecture review
- **Lovable:** rapid UI generation/prototyping
- **Replit:** optional experiments/prototypes
- **ChatGPT:** planning, architecture, prompts, debugging and demo strategy

## Repository rules

One repository, one application, one Supabase project and one shared design system.

Read `/.claude/DAYFLOW-CONTEXT.md` before making major implementation decisions.

## Documentation

- [PRD](docs/PRD.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [RBAC](docs/RBAC.md)
- [UI/UX](docs/UI-UX.md)
- [Workflows](docs/WORKFLOWS.md)
- [API/Data Operations](docs/API.md)
- [Team Roles](docs/TEAM-ROLES.md)
- [AI Tools](docs/AI-TOOLS.md)
- [Demo](docs/DEMO.md)
- [8-Hour Plan](docs/HACKATHON-PLAN.md)
- [Supabase setup](supabase/README.md)

## Source of truth

The supplied Dayflow problem statement defines the broad functional scope. The supplied Excalidraw defines additional detailed UI and behavior. Where the two are ambiguous or conflict, `docs/REQUIREMENTS.md` records the hackathon implementation decision explicitly.
