# AncesTREE
Connecting Generations Through Collaborative Genealogy

**Charles Dominic S. Hordista**\
BS Information Technology, Cebu Institute of Technology - University\
**Dione Alfred A. Cabigas**\
BS Information Technology, Cebu Institute of Technology - University\
**Arthur P. Ehem**\
BS Information Technology, Cebu Institute of Technology - University\
**Francis Nino B. Yap**\
BS Information Technology, Cebu Institute of Technology - University\
**Aldrin R. Mangubat**\
BS Information Technology, Cebu Institute of Technology - University

---

### PROJECT TECHNOLOGY STACK
*The following technologies were used for the development of this project:*

**Frontend (Client)**
* Next.js
  * Framework for react - Version 15.0.5
* React.js
  * Frontend library - Version ^19.0.0
* Axios
  * HTTP client for API calls - Version 1.9.0
* Tailwind CSS
  * Styling framework - Version 4
 
**Backend (Server)**
* Node.js
  * Runtime environment - Version 24.12.0
* Express.js
  * Backend framework - Version 5.1.0
* Firebase Authentication
  * Authentication
* Firestore Database
  * Database
* Firebase Storge
  * Storage for images and media.

 ---

 ### PROJECT ARCHITECTURE

 **Frontend Architecture**\
*The frontend is built using Next.js (React-based framework) and adopts the following:*

**Design Principles**
* Component Reusability
  * Use of React components to promote DRY (Don't Repeat Yourself) principles.\
 
**Components**
* Service Layer
  * Manages API request to the backend
  * Encapsulates logic for interaction with endpoints.
* Pages and Components
  * Built on Next.js for server-side rendering (SSR) and static site generation (SSG).
  * Includes reusable and responsive UI components.

**Backend Architecture**\
*The backend for AncesTREE follows a Repository-Service-Controller (RSC) pattern*

**Design Principles**
* SOLID Principles
  * Ensures modular, reusable, and maintainable code.
  * Separation of concerns, meaning each layer has distinct responsibilities.\

**Components**
* Repository Layer
  * Handles database operations (CRUD functionality).
* Service Layer
  * Implements business logic.
  * Processes data fetched from repositories and prepares it for controllers.
* Controller Layer
  * Manages HTTP requests and responses.
  * Delegates processing to the service layer.
* Authentication
  * Firebase Authentication for secure, stateless user sessions.
* File Storage
  * Firebase Storage used to store and retrieve image uploads efficiently.

---

### First-Time Setup

Access the live application at https://ancestree2025.netlify.app

Use the provided test credentials to log in and explore features.\
User Roles and Test Credentials\
Username: johndoe.ancestree@gmail.com\
Password: JohnDoe123!

---

### User Instructions

Visit the home page at https://ancestree2025.netlify.app
* Login
  * Use the provided credentials to access the application.
* User Features
  * View family tree data and relationships.
  * Update personal profile information
  * Use the search bar to find family members.
  * Navigate and explore the family tree interface.
    
**Production Notes**
* Backend is deployed via Render.
* Frontend is hosted on Netlify at https://ancestree.netlify.app.
* Firestore Database is used for the database.
* Firebase Storage is configured for secure storage of uploaded media files.
* Ensure environment variables are configured correctly for seamless operation.
