# StrayCare 🐾

A comprehensive platform designed to assist stray animals by connecting people who find them with rescuers, veterinarians, and people looking to adopt. 

StrayCare handles everything from the initial report (including geolocation and photos) to medical tracking, adoption workflows, and crowdfunding for specific animals' treatments. It also features a community feed to keep users engaged and updated.

## 🌟 Features

- **Stray Reporting & Tracking**: Submit stray reports with photos, geolocation, and descriptions. Track their lifecycle status from rescue to adoption.
- **Rescue & Medical Updates**: Rescuers and veterinarians can update records and treatment history.
- **Adoption & Fostering**: Swipe and explore pets needing homes. Detailed application forms with conditional approval workflows.
- **Community Feed**: Logged-in users can create posts, share updates, and interact with the stray care community.
- **Crowdfunding**: NGOs and Admins can create campaigns to raise funds via Stripe for injured strays.
- **Pet Chatbot Guide**: An automated AI guide to help users resolve quick queries regarding strays.
- **Admin Dashboard**: Manage user roles, moderate community posts, verify NGOs/clinics, and oversee financials.

## 📂 Project Structure

This project is divided into the following directories:

- `/straycare-frontend`: The main React application built with Vite and vanilla CSS.
- `/backend`: The server handling the API, database connectivity, auth, and external integrations (currently in planning phase as per SRS).

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- React Router DOM
- Vanilla CSS
- Lucide React

**Backend (Planned):**
- Node.js / Express
- PostgreSQL
- Firebase/Auth0 (Authentication)
- Stripe (Donations)
- AWS S3 / Cloudinary (Media Storage)

## 🤝 Contributing

Contributions are welcome! Please create a pull request or open an issue for major changes to discuss what you'd like to change.

## 📄 License

This project is licensed under the MIT License.
