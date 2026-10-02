# Test Plan: Company Hiring Exam Module

## Overview
This test plan outlines the verification strategy for the Company Hiring Exam Module implemented as per tmp/plan/01_COMPANY_HIRING_EXAM_MODULE_PLAN.md. The module enables corporate recruiters to create and assign skill screening tests to students, with students taking exams via the existing quiz arena and recruiters evaluating results through a dashboard.

## Test Objectives
1. Verify recruiters can create hiring exams with questions
2. Verify recruiters can assign exams to students (individuals or groups)
3. Verify students can view assigned exams in their dashboard
4. Verify students can start and complete assigned exams
5. Verify exam results are properly recorded and accessible to recruiters
6. Verify XP awarding system works correctly based on exam performance
7. Verify exam notifications alert banner functions correctly
8. Verify integration with existing systems (authentication, notifications, todos)

## Test Environment
- Frontend: React/Vite with Tailwind CSS
- Backend: Node.js/Express with SQLite database
- Authentication: JWT-based token system
- Test Data: Mock student and industry user accounts

## Test Cases

### 1. Exam Creation Tests (Industry Portal)
#### 1.1 Create Basic Exam
- **Precondition**: Industry user logged in
- **Steps**:
  1. Navigate to industry portal
  2. Click "Conduct Hiring Exam" button on a student card
  3. Fill exam form with title, description, duration
  4. Add at least one question with multiple choice options
  5. Submit exam creation
- **Expected Result**: Exam created successfully, appears in exam list

#### 1.2 Exam Validation
- **Precondition**: Industry user logged in
- **Steps**:
  1. Attempt to create exam without title
  2. Attempt to create exam without questions
  3. Attempt to create exam with invalid duration
- **Expected Result**: Appropriate validation errors shown

#### 1.3 Question Types
- **Precondition**: Industry user logged in, exam creation form open
- **Steps**:
  1. Add multiple choice question
  2. Add true/false question
  3. Add fill-in-the-blank question
- **Expected Result**: All question types saved correctly

### 2. Exam Assignment Tests
#### 2.1 Assign to Individual Student
- **Precondition**: Exam created, industry user logged in
- **Steps**:
  1. Go to exam list
  2. Click "Assign" on exam
  3. Select individual student from dropdown
  4. Confirm assignment
- **Expected Result**: Exam assigned to student, notification sent

#### 2.2 Assign to Multiple Students
- **Precondition**: Exam created, industry user logged in
- **Steps**:
  1. Go to exam list
  2. Click "Assign" on exam
  3. Select multiple students
  4. Confirm assignment
- **Expected Result**: Exam assigned to all selected students

#### 2.3 Assignment Validation
- **Precondition**: Exam created, industry user logged in
- **Steps**:
  1. Attempt to assign exam without selecting students
- **Expected Result**: Validation error shown

### 3. Student Portal Tests
#### 3.1 View Assigned Exams
- **Precondition**: Student logged in, exam assigned to student
- **Steps**:
  1. Navigate to student portal
  2. Click "Quiz Arena" tab
  3. Switch to "Enterprise Screening Exams" tab
- **Expected Result**: Assigned exam visible in list

#### 3.2 Exam Alert Banner
- **Precondition**: Student logged in, new exam assigned
- **Steps**:
  1. Load student portal page
  2. Wait for alert check
- **Expected Result**: Exam alert banner visible with count of new exams

#### 3.3 Start Exam
- **Precondition**: Student logged in, exam assigned and visible
- **Steps**:
  1. Click "Start Exam" on assigned exam
  2. Confirm exam start if prompted
- **Expected Result**: Exam interface loads with questions and timer

#### 3.4 Complete Exam
- **Precondition**: Exam started, questions displayed
- **Steps**:
  1. Answer all questions
  2. Click "Submit Exam"
  3. Confirm submission
- **Expected Result**: Exam submitted, results shown, XP awarded if passed

#### 3.5 View Exam Results
- **Precondition**: Exam submitted
- **Steps**:
  1. Navigate to assigned exams list
  2. Click "View Results" on completed exam
- **Expected Result**: Exam results modal shows score, pass/fail status, feedback

### 4. Recruiter Dashboard Tests
#### 4.1 View Exam Submissions
- **Precondition**: Industry user logged in, exams assigned and submitted by students
- **Steps**:
  1. Navigate to industry portal
  2. Go to exam list
  3. Click "Submissions" on exam
- **Expected Result**: List of student submissions with scores

#### 4.2 Review Individual Submission
- **Precondition**: Exam submissions exist
- **Steps**:
  1. Click on a student submission
- **Expected Result**: Detailed view of student's answers, correct/incorrect marking

### 5. Integration Tests
#### 5.1 Authentication
- **Precondition**: No valid token
- **Steps**:
  1. Attempt to access exam creation endpoint
  2. Attempt to access student exam endpoints
- **Expected Result**: 401 Unauthorized responses

#### 5.2 Role-Based Access
- **Precondition**: Student user logged in
- **Steps**:
  1. Attempt to access industry exam endpoints
- **Expected Result**: 403 Forbidden responses

#### 5.3 Notification System
- **Precondition**: Exam assigned to student
- **Steps**:
  1. Check notification bell for new exam notification
  2. Click notification to view details
- **Expected Result**: Notification appears in dropdown, clicking navigates to exam

#### 5.4 Todo System Integration
- **Precondition**: Exam assigned to student
- **Steps**:
  1. Check student todo list
- **Expected Result**: Todo item created for new exam assignment

### 6. Performance Tests
#### 6.1 Exam Loading Time
- **Precondition**: Exam with 10 questions
- **Steps**:
  1. Start exam
  2. Measure time to load all questions
- **Expected Result**: Load time < 2 seconds

#### 6.2 Concurrent Users
- **Precondition**: Multiple students starting same exam
- **Steps**:
  1. Have 5+ students start exam simultaneously
  2. Monitor for errors or performance degradation
- **Expected Result**: All exams start successfully, no system errors

### 7. Security Tests
#### 7.1 Exam Data Integrity
- **Precondition**: Exam in progress
- **Steps**:
  1. Attempt to tamper with exam answers via browser tools
  2. Submit exam
- **Expected Result**: Original answers preserved, tampering detected

#### 7.2 Access Control
- **Precondition**: Exam assigned to Student A
- **Steps**:
  1. Log in as Student B
  2. Attempt to access Student A's exam
- **Expected Result**: 403 Forbidden or exam not visible

## Test Data Requirements
1. **Users**:
   - 2 Industry users (recruiters)
   - 5 Student users
   - 1 Admin user (for setup)

2. **Exams**:
   - 3 Different hiring exams (Technical, Aptitude, Personality)
   - Varied question counts (5-15 questions each)
   - Mixed question types

3. **Assignments**:
   - Individual student assignments
   - Bulk assignments to groups
   - Mixed completion states (pending, in-progress, completed)

## Pass/Fail Criteria
- **Pass**: All core functionality tests pass (exam creation, assignment, taking, results)
- **Fail**: Any critical path fails (authentication, exam submission, result recording)
- **Blocking Issues**: Security vulnerabilities, data loss, authentication bypass

## Test Execution Plan
1. **Unit Testing**: Backend API endpoints (to be implemented separately)
2. **Integration Testing**: Frontend-backend communication
3. **User Acceptance Testing**: End-to-end scenarios with test users
4. **Regression Testing**: Ensure existing functionality unaffected

## Deliverables
1. Test execution report
2. Bug tracking log
3. Performance metrics
4. Security assessment summary

## Approval
This test plan requires approval from the QA lead before execution begins.

---
*Test Plan Created: 2026-10-02*
*Module: Company Hiring Exam*
*Version: 1.0*