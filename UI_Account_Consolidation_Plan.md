# UI Consolidation Plan: "My Account" vs "Account" Button

## Objective

Eliminate redundancy by consolidating the "My Account" and "Account" buttons into a single, unified entry point for all user account and settings functionality.

---

## Current State

- **"My Account" Button**: Located in the top right of the dashboard (`src/pages/DashboardPage.tsx`). Navigates to `/account`.
- **"Account" Button**: Located next to the officer's name/avatar (`src/App.tsx`). Includes a dropdown for Profile, Settings, and Logout.

---

## Issues

- Redundant entry points for account management.
- Potential user confusion and inconsistent navigation.

---

## Consolidation Plan

### 1. Remove Redundant "Account" Button

- **File:** `src/App.tsx`
- **Action:** Delete the "Account" button and its dropdown from the officer info area.

### 2. Use "My Account" as the Single Entry Point

- **File:** `src/pages/DashboardPage.tsx`
- **Action:** Retain the "My Account" button in the top right, which navigates to `/account`.

### 3. Ensure Full Account/Settings Access

- **File:** `src/pages/AccountPage.tsx`
- **Action:** Confirm that the `/account` page provides access to:
  - Profile information
  - Settings/preferences
  - Logout functionality
- **If any are missing:** Update `AccountPage.tsx` to include them.

### 4. Update Navigation and Test

- Ensure all navigation to account/settings routes now goes through the unified "My Account" button.
- Test to confirm there is no loss of functionality.

---

## Visual Reference

```mermaid
flowchart TD
    A[User] -->|Clicks| B["My Account" (Top Right)]
    B --> C[/account page/]
    C --> D[Profile/Settings/Logout]
```

---

## Benefits

- Simplifies user experience.
- Reduces UI clutter.
- Ensures all account management is centralized and easy to find.

---

## Next Steps

1. Remove the redundant button and dropdown from `src/App.tsx`.
2. Confirm `/account` page covers all required account/settings actions.
3. Test navigation and user flows.