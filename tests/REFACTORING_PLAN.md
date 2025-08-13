# Baseline Test Refactoring Plan

## Overview
This document outlines the comprehensive plan to refactor `tests/example.spec.ts` into a robust baseline test suite for the CodeSandbox Clone application running at `localhost:3000`.

## Phase 1: Test Infrastructure Setup

### 1.1 Configuration Updates
- **File**: `playwright.config.ts`
  - **Action**: Uncomment and enable `baseURL: 'http://localhost:3000'`
  - **Action**: Enable webServer configuration with `command: 'npm run dev'`
  - **Action**: Set `reuseExistingServer: true` for development
  - **Rationale**: Centralizes base URL configuration and ensures dev server is running

### 1.2 Test Helpers and Utilities
- **Create**: `tests/helpers/config.ts`
  ```typescript
  export const TEST_CONFIG = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    defaultTimeout: 30000,
    retryAttempts: 3
  };
  ```
  - **Rationale**: Centralizes configuration for easy environment switching

- **Create**: `tests/helpers/test-data.ts`
  ```typescript
  export const TEST_USERS = {
    default: {
      username: 'testuser',
      password: 'Test123!@#'
    },
    admin: {
      username: 'admin',
      password: 'Admin123!@#'
    }
  };
  
  export const TEST_PROJECTS = {
    sample: {
      name: 'Test Project',
      description: 'Automated test project'
    }
  };
  ```
  - **Rationale**: Centralizes test data for consistency

### 1.3 Page Object Model Implementation
- **Create**: `tests/pages/BasePage.ts`
  - Extract common navigation methods
  - Implement wait utilities
  - Add screenshot capture on failure
  
- **Create**: `tests/pages/LoginPage.ts`
  - Locators: username input, password input, submit button, error messages
  - Methods: `login()`, `getErrorMessage()`, `isLoggedIn()`
  
- **Create**: `tests/pages/HomePage.ts`
  - Locators: project cards, create button, user menu, logout button
  - Methods: `getProjectCount()`, `openCreateModal()`, `logout()`, `navigateToProject()`
  
- **Create**: `tests/pages/CreateProjectModal.ts`
  - Locators: name input, description input, create button, cancel button
  - Methods: `createProject()`, `cancel()`, `isVisible()`

## Phase 2: Core Baseline Tests

### 2.1 Authentication Tests
- **Create**: `tests/auth.spec.ts`
  ```typescript
  test.describe('Authentication', () => {
    test('should display login page when not authenticated', async ({ page }) => {
      // Navigate to home
      // Verify redirect to login
      // Check for login form elements
    });
    
    test('should login with valid credentials', async ({ page }) => {
      // Fill username and password
      // Submit form
      // Verify redirect to home
      // Check for user info in header
    });
    
    test('should show error with invalid credentials', async ({ page }) => {
      // Attempt login with wrong credentials
      // Verify error message appears
      // Ensure no redirect occurs
    });
    
    test('should logout successfully', async ({ page }) => {
      // Login first
      // Click logout
      // Verify redirect to login page
      // Ensure session is cleared
    });
  });
  ```

### 2.2 Project Management Tests
- **Create**: `tests/projects.spec.ts`
  ```typescript
  test.describe('Project Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login with test user
    });
    
    test('should display empty state when no projects', async ({ page }) => {
      // Check for empty state message
      // Verify create project CTA is visible
    });
    
    test('should create a new project', async ({ page }) => {
      // Click create project button
      // Fill project details
      // Submit form
      // Verify redirect to project page
      // Check project appears in list
    });
    
    test('should display project list', async ({ page }) => {
      // Create multiple test projects via API
      // Navigate to home
      // Verify all projects are displayed
      // Check project card information
    });
    
    test('should navigate to project detail page', async ({ page }) => {
      // Create test project
      // Click on project card
      // Verify URL change
      // Check project details are displayed
    });
  });
  ```

### 2.3 API Integration Tests
- **Create**: `tests/api.spec.ts`
  ```typescript
  test.describe('API Endpoints', () => {
    test('should check GitHub token status', async ({ request }) => {
      // GET /api/auth/github-status
      // Verify response structure
      // Check hasGitHubToken field
    });
    
    test('should fetch projects list', async ({ request }) => {
      // GET /api/projects
      // Verify response is array
      // Check project structure
    });
    
    test('should create project with CodeSandbox integration', async ({ request }) => {
      // POST /api/projects
      // Verify project creation
      // Check for sandboxId if CSB_API_KEY is set
    });
  });
  ```

### 2.4 Error Handling Tests
- **Create**: `tests/error-handling.spec.ts`
  ```typescript
  test.describe('Error Handling', () => {
    test('should display GitHub token error when missing', async ({ page }) => {
      // Mock API to return no token
      // Navigate to home
      // Verify GitHubTokenError component appears
      // Check retry functionality
    });
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      // Verify error messages
      // Check retry mechanisms
    });
  });
  ```

## Phase 3: Component Extraction for Storybook

### 3.1 Components to Extract

#### LoginForm Component
- **Current Location**: Embedded in login page
- **Extract to**: `app/components/ui/LoginForm.tsx`
- **Props Interface**:
  ```typescript
  interface LoginFormProps {
    onSubmit: (username: string, password: string) => Promise<void>;
    error?: string;
    isLoading?: boolean;
  }
  ```
- **Storybook Stories**: 
  - Default state
  - Loading state
  - Error state
  - Validation states

#### ProjectCard Component
- **Current Location**: Inline in home page grid
- **Extract to**: `app/components/ui/ProjectCard.tsx`
- **Props Interface**:
  ```typescript
  interface ProjectCardProps {
    project: {
      id: string;
      name: string;
      createdAt: string;
      sandboxId?: string;
    };
    onClick?: () => void;
  }
  ```
- **Storybook Stories**:
  - Default project
  - Project with long name
  - Project with sandbox
  - Hover state

#### EmptyState Component
- **Current Location**: Inline in home page
- **Extract to**: `app/components/ui/EmptyState.tsx`
- **Props Interface**:
  ```typescript
  interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
  }
  ```
- **Storybook Stories**:
  - No projects state
  - With action button
  - Custom icon
  - Loading state

#### Header Component
- **Current Location**: Inline in home page
- **Extract to**: `app/components/ui/Header.tsx`
- **Props Interface**:
  ```typescript
  interface HeaderProps {
    user?: {
      username: string;
      role: string;
    };
    projectCount: number;
    onCreateProject: () => void;
    onLogout: () => void;
  }
  ```
- **Storybook Stories**:
  - Logged in state
  - Different user roles
  - Various project counts

### 3.2 Storybook Testing Strategy

#### Create Interaction Tests
- **File**: `stories/LoginForm.stories.tsx`
  ```typescript
  export const UserLogin: Story = {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.type(canvas.getByLabelText('Username'), 'testuser');
      await userEvent.type(canvas.getByLabelText('Password'), 'password');
      await userEvent.click(canvas.getByRole('button', { name: 'Login' }));
      // Assert callback was called
    }
  };
  ```

#### Visual Regression Tests
- Configure Chromatic or similar tool
- Create baseline snapshots for each component state
- Add to CI pipeline

## Phase 4: Testing Workflow Implementation

### 4.1 GitHub Issues Creation
Create the following issues in order:

1. **Issue #1**: "Setup test infrastructure and helpers"
   - Tasks: Phase 1.1, 1.2, 1.3
   - Labels: testing, infrastructure
   
2. **Issue #2**: "Implement authentication baseline tests"
   - Tasks: Phase 2.1
   - Labels: testing, auth
   
3. **Issue #3**: "Implement project management tests"
   - Tasks: Phase 2.2
   - Labels: testing, features
   
4. **Issue #4**: "Add API and error handling tests"
   - Tasks: Phase 2.3, 2.4
   - Labels: testing, api
   
5. **Issue #5**: "Extract LoginForm component with stories"
   - Tasks: Phase 3.1 LoginForm
   - Labels: refactoring, storybook
   
6. **Issue #6**: "Extract ProjectCard component with stories"
   - Tasks: Phase 3.1 ProjectCard
   - Labels: refactoring, storybook
   
7. **Issue #7**: "Extract EmptyState and Header components"
   - Tasks: Phase 3.1 EmptyState, Header
   - Labels: refactoring, storybook

### 4.2 Tmux Session Definitions

```bash
# Session 1: Test Infrastructure
tmux new -s "Setup test infrastructure #1" zed -n --wait \
  playwright.config.ts:28:5 \
  tests/helpers/config.ts:1:1 \
  tests/helpers/test-data.ts:1:1 \
  tests/pages/BasePage.ts:1:1

# Session 2: Authentication Tests
tmux new -s "Implement auth tests #2" zed -n --wait \
  tests/auth.spec.ts:1:1 \
  tests/pages/LoginPage.ts:1:1 \
  app/components/LoginForm.tsx:1:1

# Session 3: Project Tests
tmux new -s "Implement project tests #3" zed -n --wait \
  tests/projects.spec.ts:1:1 \
  tests/pages/HomePage.ts:1:1 \
  tests/pages/CreateProjectModal.ts:1:1

# Session 4: API Tests
tmux new -s "Add API and error tests #4" zed -n --wait \
  tests/api.spec.ts:1:1 \
  tests/error-handling.spec.ts:1:1

# Session 5: LoginForm Extraction
tmux new -s "Extract LoginForm component #5" zed -n --wait \
  app/components/ui/LoginForm.tsx:1:1 \
  stories/LoginForm.stories.tsx:1:1 \
  app/components/LoginForm.tsx:50:10

# Session 6: ProjectCard Extraction
tmux new -s "Extract ProjectCard component #6" zed -n --wait \
  app/components/ui/ProjectCard.tsx:1:1 \
  stories/ProjectCard.stories.tsx:1:1 \
  app/page.tsx:130:15

# Session 7: EmptyState and Header
tmux new -s "Extract EmptyState Header #7" zed -n --wait \
  app/components/ui/EmptyState.tsx:1:1 \
  app/components/ui/Header.tsx:1:1 \
  stories/EmptyState.stories.tsx:1:1 \
  stories/Header.stories.tsx:1:1
```

## Phase 5: Test Execution Strategy

### 5.1 Local Development Workflow
1. Run dev server: `npm run dev`
2. Run Storybook: `npm run storybook`
3. Execute tests: `npm run test -- --project chromium`
4. Run Storybook tests: `npm run test-storybook`
5. Check coverage: `npm run test-storybook:coverage`

### 5.2 CI/CD Integration
- Pre-commit: Run affected tests only
- PR checks: Full test suite + coverage report
- Main branch: Full suite + visual regression
- Deploy: Smoke tests on staging

### 5.3 Test Data Management
- Use test database for E2E tests
- Reset data between test runs
- Mock external services (CodeSandbox API)
- Use fixtures for consistent test data

## Phase 6: Success Metrics

### 6.1 Coverage Goals
- Line coverage: >= 80%
- Branch coverage: >= 70%
- Component coverage: 100% for extracted components
- E2E coverage: All critical user paths

### 6.2 Performance Targets
- Test suite execution: < 5 minutes
- Individual test: < 30 seconds
- Parallel execution on CI
- Flakiness rate: < 1%

### 6.3 Documentation Requirements
- README update with test instructions
- Component documentation in Storybook
- Test case documentation in spec files
- Troubleshooting guide for common issues

## Implementation Notes

### Priority Order
1. Test infrastructure (enables all other work)
2. Authentication tests (core functionality)
3. Component extraction (improves maintainability)
4. Project management tests (main feature)
5. API/Error tests (robustness)

### Risk Mitigation
- Start with happy path tests
- Add negative test cases incrementally
- Use feature flags for new components
- Maintain backward compatibility during refactoring

### Review Checklist
- [ ] Tests pass locally
- [ ] Coverage meets thresholds
- [ ] No console errors/warnings
- [ ] Storybook stories render correctly
- [ ] Documentation updated
- [ ] PR includes test results
- [ ] No hardcoded test data in components

## Next Steps
1. Create GitHub issues using the templates above
2. Set up tmux sessions for each work item
3. Begin with Phase 1: Test Infrastructure Setup
4. Review and adjust plan after each phase completion