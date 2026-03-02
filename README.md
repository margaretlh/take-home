# Integral Take-Home Challenge

## Your Mission

Welcome to Integral's Take-Home Challenge! We need your help building a privacy-conscious clinical trial enrollment system.

**The Scenario:** A pharmaceutical research company is running multiple clinical trials and needs a secure platform where patients can submit enrollment applications. Trial coordinators must screen applications against eligibility criteria while protecting patient privacy during the initial review process. Only after a patient progresses through screening should their full personal information be revealed.

**Your task:** Build a web application that balances thorough data collection with privacy protection, enabling patients to submit comprehensive enrollment applications while allowing trial coordinators to perform initial screenings with masked personally identifiable information (PII).

## The Challenge

Build a web app where:

- A user can login as a **Patient** or **Reviewer** (Trial Coordinator)
- A **Patient** submits an enrollment application with personal information and supporting documents
- The enrollment application appears in a **Review Queue** for trial coordinators
- A **Reviewer** can toggle between **privileged** (full data) and **redacted** (masked PII) views
- Reviewers can **update status** (Pending → In Review → Approved/Rejected)
- The system records an **audit trail** of all actions for compliance
- Patients can upload supporting documents (medical records, insurance cards, etc.)

## Setup

1. Clone the repository to your local machine
2. Copy the environment file: `cp .env.example .env`
3. Install dependencies: `npm install`
4. Generate Prisma client: `npx prisma generate`
5. Run database migrations: `npx prisma migrate dev`
6. Seed the database: `npm run db:seed`
7. Start the development server: `npm run dev`
8. Visit `http://localhost:3000/` in your browser

## Design Inspiration

Design references and mockups are available in the `/public/design-inspiration/` folder. You can view them at:

- `http://localhost:3000/design-inspiration/[filename]`

These are provided as optional visual guidance. Feel free to implement your own design approach.

## Database Schema

The project uses Prisma with SQLite. The schema is defined in `prisma/schema.prisma`:

### User

- `id`, `email`, `name`, `role` (PATIENT or REVIEWER), `organization`
- Patients submit enrollment applications, Reviewers (trial coordinators) screen them

### Intake

- Patient information: `clientName`, `clientEmail`, `clientPhone`, `dateOfBirth`, `ssn`
  - _Note: These field names use "client" prefix but refer to patient data_
- Application details: `description`, `notes`
- Status: `PENDING`, `IN_REVIEW`, `APPROVED`, `REJECTED`
- Relations: `submittedBy` (User), `reviewer` (User, optional)
- **Note:** Consider adding a model for document uploads (medical records, insurance cards, prescriptions, ID photos, etc.)

### AuditLog

- `action`: Type of action (CREATED, STATUS_CHANGED, VIEWED, ASSIGNED)
- `details`: JSON string with additional context
- Relations: `user` (who performed the action), `intake` (which intake)

## Demo Users

The database is seeded with two demo users:

| Email               | Role     | Organization               |
| ------------------- | -------- | -------------------------- |
| `patient@demo.com`  | PATIENT  | (Trial Participant)        |
| `reviewer@demo.com` | REVIEWER | PharmaCorp Trial Coord.    |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page with challenge overview
│   ├── intake/
│   │   └── page.tsx          # Patient enrollment application page
│   ├── queue/
│   │   └── page.tsx          # Reviewer queue page
│   └── api/
│       ├── intakes/
│       │   ├── route.ts      # GET all intakes, POST new intake
│       │   └── [id]/
│       │       └── route.ts  # GET/PATCH single intake
│       └── users/
│           └── route.ts      # GET users
├── components/
│   ├── AuditLog.tsx          # Audit trail display
│   └── Add additional components as needed...
├── lib/
│   └── prisma.ts             # Prisma client singleton
prisma/
├── schema.prisma             # Database schema
├── seed.ts                   # Seed script
└── dev.db                    # SQLite database
```

## Goals

### Required

1. **User Authentication**: Implement an authentication system for patient and reviewer login
2. **Enrollment Application**: Implement the application form for patients to submit their information
3. **Document Uploads**: Allow patients to upload supporting documents (medical records, insurance cards, prescriptions, etc.)
4. **Review Queue**: Display a list of applications for trial coordinators to manage
5. **Detail View**: Show application details with toggle between privileged and redacted views for sensitive fields (phone, DOB, SSN)
6. **Status Updates**: Allow reviewers to change application status
7. **Audit Trail**: Record and display all actions taken on applications for compliance

### Privacy Model: Privileged vs Redacted Views

The system implements a privacy-conscious review process:

- **For Patients**: Always see their own complete, unmasked information
- **For Reviewers**: Can toggle between two views:
  - **Redacted View** (default): Masks PII during initial screening (e.g., SSN shows as `***-**-6789`, phone as `***-***-1234`)
  - **Privileged View**: Shows complete data when reviewer needs full information (e.g., after initial screening passes)

This approach protects patient privacy during the initial eligibility screening while allowing full access when necessary for enrollment processing.

## Bonus Ideas

- Filter/search in the review queue (by status, date range, eligibility criteria)
- Pagination for large datasets
- Document preview/viewer for uploaded files
- Real-time updates when applications change status
- Export audit logs for compliance reporting
- Bulk actions for reviewers (approve/reject multiple applications)
- Email notifications when application status changes

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset database and re-seed

## Time Allocation

Please limit yourself to **4 hours** on this project. We're interested in how you approach problems and prioritize work within time constraints, not just completion.

**Important:**

- **Track your time**: Note when you start and stop working
- **Commit frequently**: Make regular git commits as you work. This helps us understand your development process
- **Include in your submission**:
  - Total time spent (e.g., "Time spent: 3.5 hours")
  - What you prioritized and why
  - What you would improve with more time
  - Loom recording preferred

We value quality decision-making over feature completion.

## AI Disclaimer

You are welcome to use AI tools (e.g., GitHub Copilot, ChatGPT, Claude) to assist with this challenge. However, you are fully responsible for all code submitted. We will evaluate the quality, architecture, and implementation of your solution regardless of how it was created. Make sure you understand and can explain any code you submit.

## Submission

Once you've completed the challenge, please commit your changes, push them to your own forked GitHub repository, and share the link with us. Alternatively, emailing a zip file of the repository is acceptable.

## FAQs

**Q: Can I modify the Prisma schema?**
A: Yes! Feel free to modify the schema to better suit your approach. Note, once you modify the schema file you'll have to issue a migration via `npx prisma migrate dev` and restart your server.

**Q: Can I add additional libraries?**
A: Yes, but keep in mind the time constraint. The existing setup should be sufficient for the core requirements.

**Q: How should I handle authentication?**
A: For simplicity, you can use a basic approach (e.g., credentials). Full authentication is a bonus.

We wish you the best of luck and look forward to reviewing your solution!


## Submission Notes

**Time spent:** ~4 hours

**Loom Recording:** https://www.loom.com/share/42797691a1f14f3a82990a900a108866

### What I prioritized and why
- **User Authentication and Authorization** — I prioritized user login (authentication) by using signed JWT session cookies and implemented role-based access (authorization) to ensure patients and reviewers can only view what they are permitted to (patients can see the intake form and only reviewers can access the review queue).

- **Core functionality** — I built the intake form and documentation upload first to enable end-to-end testing with the review queue afterward. I also added the PII toggle, status updates, and audit trail before making intricate UI updates. I implemented the audit trail last since it depended on the other pieces existing first. I also enforced correct role-based permissions on the redacted/privileged toggle to ensure only reviewers can access the privileged view and defaulted to using the redacted view to protect patient security.

- **Input validation** — I added client-side validation for phone, 
  SSN, name, and date of birth to prevent typos and invalid data submissions.

- **UI design with Tailwind** — Once core features were working properly, 
  I styled the UI using Tailwind utility classes to build a clean and consistent UI without having to write custom CSS.


### What I would improve with more time

- **Make UI/UX improvements:** - improve sign out button page placement and add a homepage navigation button across all pages

- **Implement Password Hashing** — - passwords are stored as plain text for demo purposes, but later I would use bcrypt in production to hash and salt passwords in order to prevent data breach

- **Add Testing Suite** — I'd add unit and integration tests to cover authentication, PII masking, and role-based access 

- **Improve security for uploading documents** - serve uploaded documents through an authenticated API route

- **Add Swagger/OpenAPI documentation** — document all API endpoints 
  for easier integration by other developers

- **Enable Email Notifications** — notify patients when their application 
  status changes

- **Filter by date range** — add abilityn to filter enrollment applications in review queue by date range 

- **Replace Database** —  I would switch to using PostgreSQL over SQLite because it provides proper authentication and encrypted connections, and is better for handling sensitive data like patient SSNs.


### Demo Credentials
| Email | Password | Role |
| --- | --- | --- |
| `patient@demo.com` | `patient1234` | PATIENT |
| `reviewer@demo.com` | `reviewer1234` | REVIEWER |