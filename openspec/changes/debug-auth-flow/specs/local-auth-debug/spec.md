## ADDED Requirements

### Requirement: Local D1 database migrations applied before auth testing
The local D1 database SHALL have all required Better Auth tables (users, accounts, sessions, verificationTokens) created before any auth flow testing begins.

#### Scenario: First-time local setup
- **WHEN** the developer runs the local auth debug workflow for the first time
- **THEN** D1 migrations are applied and all auth tables exist

#### Scenario: Subsequent local setup
- **WHEN** the developer runs the local auth debug workflow again
- **THEN** the migration step completes without errors (idempotent or no-op)

### Requirement: API dev server running and accessible
The API dev server SHALL be running on port 8989 and respond to health checks before frontend testing begins.

#### Scenario: API server starts successfully
- **WHEN** the API dev server is started with `wrangler dev --port 8989`
- **THEN** the server is accessible at `http://localhost:8989`

#### Scenario: Auth routes are mounted
- **WHEN** a POST request is sent to `http://localhost:8989/api/auth/sign-in`
- **THEN** the server responds (not a 404), indicating the route exists

### Requirement: Web dev server running and accessible
The web dev server SHALL be running on port 4545 and serve the login and registration pages.

#### Scenario: Web server starts successfully
- **WHEN** the web dev server is started with `astro dev --port 4545`
- **THEN** the server is accessible at `http://localhost:4545`

#### Scenario: Login page is served
- **WHEN** a GET request is sent to `http://localhost:4545/login`
- **THEN** the login page HTML is returned with a sign-in form

### Requirement: User registration flow works end-to-end
The system SHALL allow a new user to register via the frontend form, create a record in D1, and return a successful response with session cookies.

#### Scenario: Successful registration with valid credentials
- **WHEN** a user submits the registration form with a valid email, name, and password (≥8 characters)
- **THEN** a new user record is created in the D1 `users` table
- **AND** a session is created in the `sessions` table
- **AND** the response includes `Set-Cookie` headers with `ourapix.session`
- **AND** the response status indicates success

#### Scenario: Registration with weak password
- **WHEN** a user submits the registration form with a password shorter than 8 characters
- **THEN** the registration fails with an error response
- **AND** no user record is created in the database

#### Scenario: Registration with duplicate email
- **WHEN** a user submits the registration form with an email that already exists
- **THEN** the registration fails with an appropriate error message
- **AND** no duplicate user record is created

### Requirement: User login flow works end-to-end
The system SHALL allow a registered user to log in via the frontend form, validate credentials, and return a valid session cookie.

#### Scenario: Successful login with valid credentials
- **WHEN** a user submits the login form with a registered email and correct password
- **THEN** the credentials are validated against the D1 database
- **AND** a session is created or updated in the `sessions` table
- **AND** the response includes `Set-Cookie` headers with `ourapix.session`
- **AND** the response status indicates success

#### Scenario: Login with incorrect password
- **WHEN** a user submits the login form with a registered email and wrong password
- **THEN** the login fails with an authentication error
- **AND** no session is created

#### Scenario: Login with non-existent email
- **WHEN** a user submits the login form with an email not in the database
- **THEN** the login fails with an authentication error

### Requirement: Session validation after login
After successful login, the session cookie SHALL be valid for accessing protected API routes.

#### Scenario: Accessing protected route with valid session
- **WHEN** a request is made to a protected API route with the `ourapix.session` cookie
- **THEN** the auth middleware validates the session and allows the request

#### Scenario: Accessing protected route without session
- **WHEN** a request is made to a protected API route without a valid session cookie or token
- **THEN** the auth middleware returns a 401 Unauthorized response

### Requirement: Secure cookie flag stripped for local HTTP development
The system SHALL strip the `Secure` flag from session cookies during local HTTP development to allow cookies to be set without HTTPS.

#### Scenario: Local development cookie handling
- **WHEN** the API runs on `http://localhost:8989` and creates a session cookie
- **THEN** the `Secure` flag is removed from the `Set-Cookie` header
- **AND** the browser accepts and stores the cookie
