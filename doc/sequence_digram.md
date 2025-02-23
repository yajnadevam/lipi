## Sequence Diagram

The updated sequence diagram shows:

1. Initial Flow:
- User accesses the keyboard page
- Page initializes with InputSelector component
- Selected input method is loaded

2. SLP1 Input Path:
- User types in SLP1 format
- Text is converted to Devanagari using Sanscript library
- Converted text is emitted with both devanagari and forIndus properties
- Text is displayed in Indus script

3. Devanagari Input Path:
- User types directly in Devanagari
- Text is updated in keyboard component
- Text is converted to Indus script
- Result is displayed

4. Preview Features:
- Shows original input
- Shows Devanagari conversion (for SLP1)
- Shows IAST transliteration (for SLP1)
- Shows final Indus script output

5. Input Method Switching:
- User can switch between input methods
- Current input is cleared
- Interface updates to show appropriate input component
- State is preserved in localStorage

This diagram better reflects the current implementation with both input methods and the preview functionality. 

```mermaid
sequenceDiagram
    participant U as User
    participant K as Keyboard Page
    participant IS as InputSelector
    participant S1 as SLP1Input
    participant SC as Sanscript Library
    participant DI as Devanagari Input
    participant O as Output Display

    U->>K: Access Keyboard Page
    activate K
    K->>IS: Initialize Input Selector
    activate IS
    IS-->>K: Return Selected Input Method
    deactivate IS

    alt SLP1 Input Selected
        U->>S1: Type SLP1 Text (e.g. "rAma")
        activate S1
        S1->>SC: Convert to Devanagari
        activate SC
        SC-->>S1: Return Devanagari ("राम")
        deactivate SC
        S1->>K: Emit text-change (devanagari & forIndus)
        deactivate S1
        K->>O: Convert to Indus Script
        activate O
        O-->>U: Display Result
        deactivate O
    else Devanagari Input Selected
        U->>DI: Type Devanagari
        activate DI
        DI->>K: Update Text Value
        deactivate DI
        K->>O: Convert to Indus Script
        activate O
        O-->>U: Display Result
        deactivate O
    end

    rect rgb(240, 240, 240)
        Note over K,O: Preview shows:
        Note over K,O: 1. Original Input
        Note over K,O: 2. Devanagari (for SLP1)
        Note over K,O: 3. IAST (for SLP1)
        Note over K,O: 4. Indus Script
    end

    U->>IS: Switch Input Method
    activate IS
    IS->>K: Update Input Method
    K->>K: Clear Current Input
    K->>K: Update Display
    IS-->>U: Show New Input Interface
    deactivate IS
    deactivate K
```