# Plan: Integrate MongoDB Connection in server.js

## Objective
Ensure the backend connects to MongoDB using Mongoose so that the User model and other database models function correctly for authentication and user management.

---

## Steps

1. **Import and Call connectDB**
   - In `server.js`, after importing `connectDB` from `./src/database/connection`, insert a call to `connectDB()` at the top of the file.
   - The call should be made asynchronously (do not `await`), allowing the server to start even if the database connection is still pending.

2. **Order of Operations**
   - The recommended order in `server.js`:
     1. Import `connectDB`
     2. Call `connectDB()`
     3. Import models (e.g., `User`)
     4. Register routes

3. **Environment Variable**
   - Ensure `MONGODB_URI` is set in your `.env` file and documented in `.env.example`.

---

## Example Code Snippet

```js
// server.js (top of file)
const connectDB = require('./src/database/connection');
connectDB(); // Connect asynchronously

// ...rest of imports and server setup
```

---

## Mermaid Diagram

```mermaid
flowchart TD
    A[server.js starts] --> B[Import connectDB]
    B --> C[Call connectDB()]
    C --> D[MongoDB connection established]
    D --> E[Import models]
    E --> F[Register routes]
```

---

## Notes

- This approach allows the server to start and handle requests even if the database connection is still pending or fails, as per user preference.
- All Mongoose models (e.g., User) will use the established connection once available.
- Connection errors will be logged to the console as implemented in `src/database/connection.js`.