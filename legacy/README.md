# Lunark — Legacy Version

> **Original project (2024)** — PAP (Prova de Aptidão Profissional), Escola Profissional de Valongo

This folder contains the original PHP clothing store built during the GPSI (Gestão de Programação de Sistemas Informáticos) professional course. It is preserved here as a historical reference to show the evolution from a student project to a modern full-stack e-commerce platform.

## Original Stack

- **Backend:** PHP (no framework)
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript
- **Server:** XAMPP / WAMP (localhost only)

## Known Limitations

This version was a learning project and contains significant issues that motivated the complete rewrite:

- SQL injection vulnerabilities in most database queries
- Plaintext password storage (no hashing)
- Hardcoded admin credentials
- No CSRF protection
- No input validation on file uploads
- No responsive design considerations
- Monolithic architecture with no separation of concerns
- No deployment capability (localhost only)

## Structure

```
legacy/
├── website/        # PHP application files, CSS, JS, images
├── database/       # MySQL database schema (ecomerce.sql)
└── docs/           # Original PAP report (Portuguese)
```

## Note

This code is **not intended for production use**. It exists solely to demonstrate the starting point of the Lunark project and the progression in software engineering skills, security practices, and modern architecture.
