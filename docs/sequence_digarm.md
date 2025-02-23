Here is  the  sequence diagram to show the main interactions in this Vue.js application. I'll focus on the core user interactions and data flow.



I've created a sequence diagram showing the main interactions in the application. Here's what it illustrates:

1. Initial Application Load:
- User accesses the application
- App.vue initializes and sets up the router
- Main page loads and initializes the store
- Preferences are loaded from local storage
- Key component loads and processes CSV data

2. Main User Interactions:
- Search/Filter functionality
- Theme toggling with persistence
- Inscription detail viewing
- Navigation between components

3. Data Flow:
- CSV data processing
- Local storage interactions
- Component communication
- Router navigation

4. Key Components:
- App.vue as the main entry point
- Router for navigation
- Main page handling core functionality
- Key component for reference data
- Store for state management
- Local Storage for persistence

The diagram shows both synchronous and asynchronous operations, with activations indicating when components are actively processing. Notes help clarify complex operations like inscription data processing.

```mermaid
sequenceDiagram
    participant U as User
    participant A as App.vue
    participant R as Router
    participant M as Main Page
    participant K as Key Component
    participant S as Store
    participant L as Local Storage
    
    U->>A: Access Application
    activate A
    A->>R: Initialize Router
    activate R
    R->>M: Route to Main Page
    activate M
    
    M->>S: Initialize Store
    activate S
    S-->>M: Store Ready
    deactivate S
    
    M->>L: Load Preferences
    activate L
    L-->>M: Return Theme/Page/Search Settings
    deactivate L
    
    M->>K: Load Key Component
    activate K
    K->>K: Parse CSV Data
    K-->>M: Render Key Reference
    deactivate K
    
    Note over M: Process Inscription Data
    M->>M: Load CSV Files
    M->>M: Process Devanagari
    M->>M: Initialize Data Table
    
    U->>M: Search/Filter Request
    activate M
    M->>M: Filter Inscriptions
    M-->>U: Display Results
    deactivate M
    
    U->>M: Toggle Theme
    activate M
    M->>L: Save Theme Preference
    M->>M: Update UI
    M-->>U: Display Updated Theme
    deactivate M
    
    U->>M: Click Inscription
    activate M
    M->>M: Expand Details
    M->>M: Show Translation
    M-->>U: Display Details
    deactivate M
    
    U->>M: Navigate to Keyboard
    M->>R: Route Change
    R->>A: Load Keyboard Component
    A-->>U: Show Keyboard Interface
    
    deactivate M
    deactivate R
    deactivate A
```
