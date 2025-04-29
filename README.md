# AI Study Buddy
Deployed At: [AI Study Buddy](https://ai-study-buddy-mu.vercel.app)
Full Showcase: [Youtube Video](https://www.youtube.com/watch?v=9iTUzofEFoE)

AI Study Buddy is a web application designed to enhance your learning experience by leveraging the power of AI. Upload your study materials, and let the AI help you generate flashcards, create quizzes, and answer your questions about the content.

Built with React, Node , MongoDB and powered by the Google Gemini API.

## Features

*   **User Accounts:** Create a secure account. A secret key is provided to allow for password changes if needed.
*   **Bring Your Own API Key:** Connect your personal Google Gemini API key to power the AI features.
*   **Context Loading:** Easily upload documents or paste text directly into the application to set the study context.
*   **Flashcard Generation:** Automatically create flashcards based on the provided study material.
*   **Quiz Generation & Feedback:** Generate quizzes from your content and get instant feedback on your performance.
*   **AI Assistant:** Ask specific questions about the uploaded material and receive AI-generated answers.

## Getting Started

1.  **Clone the repository :**
    ```bash
    git clone https://github.com/taciturn2021/AIStudyBuddy.git
    cd AIStudyBuddy
    ```
2. **Setup the .env files:** Create a .env file in both the frontend and backend folders and fill them with the required info.
3.  **Open the application:** Run the backend using node through
    ```bash
    npm start
    ```
4.  Start the frontend using 
    ```bash
    npm run dev
    ```
    
5.  **API Key:** Upon first use or within the settings, you will need to provide your Google Gemini API key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey) (it is encrypted on storage).

## How to Use

1.  **Sign Up / Log In:** Create a new account or log in to your existing account. Remember to save your secret key securely if you create a new account.
2.  **Enter API Key:** If prompted, enter your Google Gemini API key.
3.  **Provide Context:**
    *   Use the 'Upload Document' feature to load study material from a file.
    *   Alternatively, paste text directly into the designated context area.
4.  **Utilize AI Features:**
    *   Click **"Generate Flashcards"** to create flashcards based on the current context.
    *   Click **"Generate Quiz"** to test your knowledge with AI-generated questions and receive feedback.
    *   Use the **"Ask AI Assistant"** feature to ask specific questions about the material you've provided.



## Future Improvements

*   **Multiple Document Upload:** Allow users to upload and process multiple documents simultaneously.
*   **Expanded File Format Support:** Add support for more file types beyond plain text (e.g., PDF, DOCX, Markdown).
*   **Image Recognition (OCR):** Implement Optical Character Recognition (OCR) to extract text from images within uploaded documents or standalone image files.
*   **Advanced Quiz Options:** Offer more customization for quizzes, such as different question types (multiple choice, true/false, fill-in-the-blank) or difficulty levels.
*   **Spaced Repetition:** Integrate a spaced repetition system (SRS) for flashcards to optimize memorization.
*   **UI/UX Enhancements:** Enhance user experience especially for mobile users.
