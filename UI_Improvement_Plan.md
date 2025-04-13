# LARK Dashboard UI Improvement Plan

## 1. Prioritize the Chat Experience

- **Make the Chat Panel the Central Focus**: Expand the chat area to occupy more horizontal space, making it the main interaction point.
- **Reduce Visual Weight of Side Panels**: Move Miranda Workflow and Statutes to a right-hand sidebar or collapsible drawer, so they are accessible but secondary.
- **Add Chat Enhancements**:
  - Show recent or suggested prompts when chat is empty.
  - Add quick action buttons (e.g., "Start Miranda Workflow", "Analyze Statute") within the chat for seamless workflow integration.
  - Display chat history with clear timestamps and sender distinction.

## 2. Improve Visual Hierarchy & Layout

- **Header**: Integrate location, time, and status more tightly with the main content, possibly as a sticky sub-header.
- **Spacing & Sizing**: Increase padding and margin between elements for clarity.
- **Consistent Card Styles**: Use uniform card styles for all panels, but with clear size/weight differences.

## 3. Accessibility & Usability

- **Contrast**: Ensure all text meets WCAG AA contrast standards.
- **Labels & Instructions**: Add clear labels and helper text to all form fields.
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible.
- **Responsive Design**: Use a columnar layout on desktop, but stack panels vertically on mobile.

## 4. Microinteractions & Feedback

- **Loading/Processing States**: Show spinners or progress bars when actions are in progress.
- **Success/Error Feedback**: Use toast notifications or inline messages for user actions.

## 5. Optional Enhancements

- **Voice Input**: Add a microphone button to the chat for voice-to-text.
- **User Personalization**: Show user’s name or avatar in the header.

---

## Proposed Layout (Mermaid Diagram)

```mermaid
flowchart TD
    Header[Header: LARK | Location | Time | Status | Account]
    MainArea[Main Area]
    ChatPanel[Chat Panel (Primary, Large)]
    Sidebar[Sidebar (Miranda Workflow, Statutes, Quick Actions)]
    Footer[Footer (if needed)]

    Header --> MainArea
    MainArea --> ChatPanel
    MainArea --> Sidebar
    ChatPanel -.-> Footer
    Sidebar -.-> Footer
```

- **Desktop**: Chat panel is wide and central, sidebar is right-aligned and narrower.
- **Mobile**: Chat panel is on top, sidebar collapses below or into a drawer.

---

## Summary

- The chat assistant should be the primary focus of the dashboard.
- Supporting workflows (Miranda, Statutes) should be accessible but visually secondary.
- Improvements should address visual hierarchy, accessibility, responsiveness, and user feedback.