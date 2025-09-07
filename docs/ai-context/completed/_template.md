# Improvement: [FEATURE NAME]

## 🎯 AI Assistant Instructions
Read the project context (`00-project-context.md`) and architecture (`01-architecture-overview.md`) before implementing this feature.

## 📋 Overview
**Priority**: [High/Medium/Low]  
**Category**: [Architecture/Feature/Integration/Performance/Security/Testing/Documentation]  
**Complexity**: [Simple/Medium/Complex]  
**Breaking Change**: [Yes/No]

### Brief Description
[One paragraph describing what this improvement does and why it's needed]

## 🎯 Success Criteria
- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
- [ ] [Specific measurable outcome 3]

## 📐 Technical Design

### Proposed Solution
[Describe the technical approach]

### New Classes/Modules
```javascript
// Example structure
class NewClassName {
    constructor() {}
    methodName() {}
}
```

### API Changes
```javascript
// Before
existingMethod(param1)

// After
existingMethod(param1, param2) // describe change
```

### File Structure Changes
```
src/
└── classes/
    └── [new directories/files]
```

## 🔄 Implementation Steps

1. **Step 1**: [Description]
   ```javascript
   // Code example if needed
   ```

2. **Step 2**: [Description]

3. **Step 3**: [Description]

## 🧪 Testing Requirements

### Unit Tests
```javascript
describe('FeatureName', () => {
    it('should [behavior]', () => {
        // Test case
    });
});
```

### Integration Tests
[Describe integration test scenarios]

### Edge Cases to Test
- [Edge case 1]
- [Edge case 2]

## 📦 Dependencies
- [ ] No new dependencies
- [ ] New dev dependency: [package-name]
- [ ] New runtime dependency: [package-name]

## 🔄 Migration Guide
[If breaking change, describe how users should migrate]

## 📚 Documentation Updates
- [ ] Update README.md
- [ ] Update JSDoc comments
- [ ] Add example usage
- [ ] Update architecture overview

## ⚠️ Risks & Considerations
- [Potential risk 1]
- [Potential risk 2]

## 🔗 Related Improvements
- [Link to related improvement]
- [Link to dependent improvement]

## 📝 Implementation Notes
[Space for notes during implementation]

## ✅ Acceptance Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Follows project conventions
- [ ] Performance impact assessed
- [ ] Security implications considered

## 🎯 Example Usage
```javascript
// Show how the feature will be used
import { NewFeature } from 'balancebookjs';

const example = new NewFeature();
example.doSomething();
```

---
*Status: [Not Started/In Progress/Review/Complete]*  
*Assigned: [Username/Unassigned]*  
*PR: [#PR-number or N/A]*
