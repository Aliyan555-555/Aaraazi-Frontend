# Test Suite

All tests live in this dedicated folder. Source files contain no test files.

## Structure

```
src/__tests__/
├── components/       # Component tests (AuthProvider, WhiteLabelProvider)
│   └── auth/
├── hooks/           # Hook tests (useContacts)
├── lib/             # Lib/validation tests (auth.schemas)
│   └── validation/
├── services/        # Service CRUD tests (auth, contacts, documents, properties)
├── store/           # Store tests (useAuthStore session persistence)
└── stores/          # Zustand store tests (contacts.store)
```

## Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Modules Covered

- **Authentication**: auth.service (CRUD, white-label), useAuthStore, AuthProvider, WhiteLabelProvider, auth.schemas
- **Contacts**: contacts.service (CRUD), contacts.store, useContacts hook
- **Documents**: documents.service (CRUD)
- **Properties**: properties.service (CRUD)
