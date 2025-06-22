# **App Name**: LookerLink

## Core Features:

- User Authentication: Firebase Authentication: Authenticate users via email and password using Firebase.
- Get User ID: User ID Retrieval: Get the current user's unique ID (uid) after successful login.
- Fetch Looker URL: Firestore Integration: Connect to Firestore and fetch the Looker Studio embed URL for the user.
- Dynamic Filtering: Data Filtering Tool: Ensure the Looker Studio embed URL dynamically includes filters, so the Looker report only shows data from BigQuery where `user_id` equals the current `user.uid`.
- Dashboard Embed: Dashboard Display: Display the Looker Studio dashboard inside the app using an `<iframe>`.
- Authentication Guard: Route Protection: Automatically redirect unauthenticated users to the `/login` screen.

## Style Guidelines:

- Primary color: Strong indigo (#4F46E5) for a focused and professional atmosphere.
- Background color: Very light gray (#F9FAFB), a desaturated version of the primary hue.
- Accent color: Deep purple (#7C3AED), to draw the eye toward interactive and highlighted elements.
- Body and headline font: 'Inter' (sans-serif) for a modern and neutral design. Its clean lines work for both headers and content blocks.
- Clean project structure with src/app, components, and services folders to keep code organized and maintainable.
- Consistent spacing and padding to ensure a professional look.
- Subtle transitions and loading animations to enhance user experience.