# FalconShop - INFO 5139 Application Project

A React Native (Expo) marketplace app with Firebase backend supporting three user roles: **Student**, **Donor**, and **Admin**.

## Features
- **Students**: Browse products, add to cart, checkout, wishlist, order history
- **Donors**: Post and manage item listings
- **Admin**: Dashboard, user management (search, filter, role changes, disable/enable accounts), moderation queue, error logs

## Deployed App
**https://falconshop-info5139.netlify.app**

## Setup
1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env` and fill in your Firebase config values.
3. In Firebase Console, enable Email/Password Auth, Firestore, and Realtime Database.
4. Run `npx expo start --web` to launch locally.
