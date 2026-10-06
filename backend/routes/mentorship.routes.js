/**
 * JOBLEX Mentorship & 1-on-1 Guidance Routes (JavaScript / Node.js)
 * Implements SIH 26044 Feature: Students easily send a request for 1-on-1 guidance,
 * connecting learners with verified academic professors or industry leaders.
 */
const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Initialize in-memory storage for mentorship if not present
if (!DB.mentorship_profiles) DB.mentorship_profiles = [];
if (!DB.mentorship_requests) DB.mentorship_requests = [];
if (!DB.mentorship_relationships) DB.mentorship_relationships = [];
if (!DB.mentorship_sessions) DB.mentorship_sessions = [];

// POST /api/mentorship/register: Register as a mentor (Academy & Industry)
router.post('/register', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const {
      name,
      designation,
      institution_or_company,
      department,
      domains,
      bio,
      max_mentees = 5,
      available_slots = []
    } = req.body;

    if (!name || !designation || !institution_or_company || !domains || !Array.isArray(domains)) {
      return res.status(400).json({ success: false, error: 'Name, designation, institution/company, and domains are required.' });
    }

    const userId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    const role = req.user.role; // 'academy' or 'industry'

    // Check if already registered
    let existing = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_profiles').select('*').eq('user_id', userId).maybeSingle();
        existing = data;
      } catch (err) {}
    }
    if (!existing) {
      existing = DB.mentorship_profiles.find(p => p.user_id === userId);
    }
    if (existing) {
      return res.status(409).json({ success: false, error: 'You are already registered as a mentor. Use PUT to update.' });
    }

    const newProfile = {
      id: `mentor-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      name,
      role,
      institution_or_company,
      designation,
      department,
      domains,
      bio,
      max_mentees: Number(max_mentees),
      current_mentee_count: 0,
      accepting_new_mentees: true,
      available_slots,
      total_sessions_completed: 0,
      rating: 5.0,
      total_ratings: 0,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    let savedProfile;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_profiles')
          .insert({
            id: newProfile.id,
            user_id: newProfile.user_id,
            name: newProfile.name,
            role: newProfile.role,
            institution_or_company: newProfile.institution_or_company,
            designation: newProfile.designation,
            department: newProfile.department,
            domains: newProfile.domains,
            bio: newProfile.bio,
            max_mentees: newProfile.max_mentees,
            current_mentee_count: newProfile.current_mentee_count,
            accepting_new_mentees: newProfile.accepting_new_mentees,
            available_slots: newProfile.available_slots,
            total_sessions_completed: newProfile.total_sessions_completed,
            rating: newProfile.rating,
            total_ratings: newProfile.total_ratings,
            is_verified: newProfile.is_verified,
            created_at: newProfile.created_at
          })
          .select()
          .single();
        if (!error && data) savedProfile = data;
      } catch (err) {
        console.warn('[Register mentor] Supabase warning:', err.message);
      }
    }

    if (!savedProfile) {
      DB.mentorship_profiles.push(newProfile);
      savedProfile = newProfile;
    }

    return res.status(201).json({
      success: true,
      message: 'You are now registered as a verified mentor!',
      profile: savedProfile
    });
  } catch (err) {
    console.error('[Register mentor] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to register as mentor.' });
  }
});

// GET /api/mentorship/my-profile: Get logged-in user's mentor profile
router.get('/my-profile', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const userId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    let profile = null;

    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_profiles').select('*').eq('user_id', userId).maybeSingle();
        profile = data;
      } catch (err) {}
    }
    if (!profile) {
      profile = DB.mentorship_profiles.find(p => p.user_id === userId);
    }
    if (!profile) {
      return res.status(404).json({ success: false, error: 'No mentor profile found. Register first.' });
    }

    return res.json({ success: true, profile });
  } catch (err) {
    console.error('[Get my profile] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve mentor profile.' });
  }
});

// PUT /api/mentorship/my-profile: Update mentor profile
router.put('/my-profile', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const userId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    const {
      domains,
      bio,
      max_mentees,
      available_slots,
      accepting_new_mentees
    } = req.body;

    let profile = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_profiles')
          .update({
            domains,
            bio,
            max_mentees: max_mentees ? Number(max_mentees) : undefined,
            available_slots,
            accepting_new_mentees,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && data) profile = data;
      } catch (err) {}
    }
    if (!profile) {
      const idx = DB.mentorship_profiles.findIndex(p => p.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, error: 'No mentor profile found.' });
      DB.mentorship_profiles[idx] = { ...DB.mentorship_profiles[idx], domains, bio, max_mentees: max_mentees ? Number(max_mentees) : DB.mentorship_profiles[idx].max_mentees, available_slots, accepting_new_mentees, updated_at: new Date().toISOString() };
      profile = DB.mentorship_profiles[idx];
    }

    return res.json({ success: true, message: 'Mentor profile updated!', profile });
  } catch (err) {
    console.error('[Update mentor profile] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to update mentor profile.' });
  }
});

// GET /api/mentorship/mentors: Browse all active mentors with multi-parameter search
router.get('/mentors', authenticateToken, async (req, res) => {
  try {
    const { type, domain, institution, designation, minRating, accepting, q } = req.query;

    let mentors = [];
    if (isConfigured && supabase) {
      try {
        let query = supabase.from('mentorship_profiles').select('*').eq('is_verified', true);
        if (type) query = query.eq('role', type);
        if (accepting === 'true') query = query.eq('accepting_new_mentees', true);
        const { data, error } = await query;
        if (!error && data) mentors = data;
      } catch (err) {
        console.warn('[Get mentors] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (mentors.length === 0) {
      mentors = DB.mentorship_profiles.filter(mentor => mentor.is_verified);
    }

    // Apply filters
    if (type) mentors = mentors.filter(m => m.role === type);
    if (accepting === 'true') mentors = mentors.filter(m => m.accepting_new_mentees);
    if (domain) mentors = mentors.filter(m => m.domains && m.domains.some(d => d.toLowerCase().includes(domain.toLowerCase())));
    if (institution) mentors = mentors.filter(m => m.institution_or_company && m.institution_or_company.toLowerCase().includes(institution.toLowerCase()));
    if (designation) mentors = mentors.filter(m => m.designation && m.designation.toLowerCase().includes(designation.toLowerCase()));
    if (minRating) mentors = mentors.filter(m => (m.rating || 0) >= parseFloat(minRating));
    if (q) {
      const qLower = q.toLowerCase();
      mentors = mentors.filter(m =>
        m.name.toLowerCase().includes(qLower) ||
        m.bio?.toLowerCase().includes(qLower) ||
        m.domains?.some(d => d.toLowerCase().includes(qLower)) ||
        m.institution_or_company?.toLowerCase().includes(qLower) ||
        m.designation?.toLowerCase().includes(qLower)
      );
    }

    // Return mentors without sensitive info
    const safeMentors = mentors.map(({ user_id, ...mentorWithoutSensitive }) => mentorWithoutSensitive);
    return res.json({ success: true, mentors: safeMentors });
  } catch (err) {
    console.error('[Get mentors] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve mentors.' });
  }
});

// POST /api/mentorship/requests: Student submits a 1-on-1 guidance request
router.post('/requests', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const {
      mentorId,
      guidanceTrack,
      personalStatement,
      goals,
      preferredTimeSlot,
      studentId,
      studentName,
      studentEmail,
      studentDepartment,
      studentSkills
    } = req.body;

    if (!mentorId || !guidanceTrack || !personalStatement || !goals || !preferredTimeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Mentor ID, guidance track, personal statement, goals, and preferred time slot are required.'
      });
    }

    const validTracks = [
      'Career & Placement Readiness',
      'Research Proposal & Methodology',
      'Technical Project Architecture Review',
      'Curriculum & Advanced Electives Consultation'
    ];
    if (!validTracks.includes(guidanceTrack)) {
      return res.status(400).json({
        success: false,
        error: `Invalid guidance track. Must be one of: ${validTracks.join(', ')}`
      });
    }

    // Get student info from token/user
    const actualStudentId = studentId || req.user?.id || 'usr-student-01';
    const actualStudentName = studentName || req.user?.name || 'Aarav Sharma';
    const actualStudentEmail = studentEmail || req.user?.email || 'aarav.sharma@aiia.gov.in';
    const actualStudentDepartment = studentDepartment || req.user?.department || 'Ayush Health Informatics & Phytopharmacology';

    // Verify mentor exists
    let mentor = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_profiles')
          .select('*')
          .eq('id', mentorId)
          .single();
        if (!error && data) mentor = data;
      } catch (err) {}
    }
    if (!mentor) {
      mentor = DB.mentorship_profiles.find(m => m.id === mentorId);
    }
    if (!mentor) {
      return res.status(404).json({ success: false, error: 'Mentor not found.' });
    }

    // Check if mentor is accepting
    if (!mentor.accepting_new_mentees) {
      return res.status(409).json({ success: false, error: 'This mentor is not currently accepting new mentees.' });
    }

    // Check capacity
    if ((mentor.current_mentee_count || 0) >= (mentor.max_mentees || 5)) {
      return res.status(409).json({ success: false, error: 'This mentor has reached their maximum mentee capacity.' });
    }

    // Check for duplicate pending application
    let duplicate = false;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('student_id', actualStudentId)
          .eq('mentor_id', mentorId)
          .eq('status', 'Pending Review')
          .maybeSingle();
        duplicate = !!data;
      } catch (err) {}
    }
    if (!duplicate) {
      duplicate = DB.mentorship_requests.some(r => r.studentId === actualStudentId && r.mentorId === mentorId && r.status === 'Pending Review');
    }
    if (duplicate) {
      return res.status(409).json({ success: false, error: 'You already have a pending application with this mentor.' });
    }

    // Create mentorship request
    const newRequest = {
      id: `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: actualStudentId,
      studentName: actualStudentName,
      studentEmail: actualStudentEmail,
      studentDepartment: actualStudentDepartment,
      studentSkills: Array.isArray(studentSkills) ? studentSkills : [],
      mentorId: mentor.user_id || (mentor.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01'),
      mentorName: mentor.name,
      mentorRole: mentor.role,
      guidanceTrack: guidanceTrack.trim(),
      personalStatement: personalStatement.trim(),
      goals: goals.trim(),
      preferredTimeSlot: preferredTimeSlot.trim(),
      status: 'Pending Review',
      mentorFeedback: null,
      createdAt: new Date().toISOString(),
      respondedAt: null
    };

    // Save request to database
    let savedRequest;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .insert({
            id: newRequest.id,
            student_id: newRequest.studentId,
            student_name: newRequest.studentName,
            student_email: newRequest.studentEmail,
            student_department: newRequest.studentDepartment,
            student_skills: newRequest.studentSkills,
            mentor_id: newRequest.mentorId,
            mentor_name: newRequest.mentorName,
            mentor_role: newRequest.mentorRole,
            mentor_user_id: mentor.user_id || (mentor.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01'),
            guidance_track: newRequest.guidanceTrack,
            personal_statement: newRequest.personalStatement,
            goals: newRequest.goals,
            preferred_time_slot: newRequest.preferredTimeSlot,
            status: newRequest.status,
            mentor_feedback: newRequest.mentorFeedback,
            created_at: newRequest.createdAt,
            responded_at: newRequest.respondedAt
          })
          .select()
          .single();
        if (!error && data) savedRequest = data;
      } catch (err) {
        console.warn('[Create mentorship request] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (!savedRequest) {
      DB.mentorship_requests.unshift(newRequest);
      savedRequest = newRequest;
    }

    // Notify mentor via in-portal notification
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: mentor.user_id || (mentor.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01'),
      senderId: actualStudentId,
      title: `New 1-on-1 Guidance Request from ${actualStudentName}`,
      message: `${actualStudentName} has requested a 1-on-1 guidance session on "${guidanceTrack}".`,
      actionUrl: `/${mentor.role === 'academy' ? 'academy' : 'industry'}.html#mentorship-inbox`,
      category: 'mentorship_request',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Guidance request sent successfully!',
      request: savedRequest
    });
  } catch (err) {
    console.error('[Create mentorship request] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to send guidance request.' });
  }
});

// DELETE /api/mentorship/my-requests/:id: Student withdraws a pending application
router.delete('/my-requests/:id', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const studentId = req.user?.id || 'usr-student-01';

    let request = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (!error && data) request = data;
      } catch (err) {}
    }
    if (!request) {
      request = DB.mentorship_requests.find(r => r.id === requestId);
    }
    if (!request) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }
    if (request.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Not authorized to withdraw this application.' });
    }
    if (request.status !== 'Pending Review') {
      return res.status(409).json({ success: false, error: 'Can only withdraw pending applications.' });
    }

    let deleted = false;
    if (isConfigured && supabase) {
      try {
        const { error } = await supabase.from('mentorship_requests').delete().eq('id', requestId);
        if (!error) deleted = true;
      } catch (err) {}
    }
    if (!deleted) {
      const idx = DB.mentorship_requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        DB.mentorship_requests.splice(idx, 1);
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(500).json({ success: false, error: 'Failed to withdraw application.' });
    }

    return res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (err) {
    console.error('[Withdraw application] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to withdraw application.' });
  }
});

// GET /api/mentorship/my-requests: Student retrieves their guidance requests
router.get('/my-requests', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user?.id || 'usr-student-01';
    let requests = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });
        if (!error && data) requests = data;
      } catch (err) {
        console.warn('[Get my requests] Supabase warning:', err.message);
      }
    }

    if (requests.length === 0) {
      requests = DB.mentorship_requests.filter(r => r.studentId === studentId);
    }

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[Get my requests] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve your guidance requests.' });
  }
});

// GET /api/mentorship/mentor-inbox: Mentor retrieves incoming requests
router.get('/mentor-inbox', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const mentorId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    let requests = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('mentor_user_id', mentorId)
          .order('created_at', { ascending: false });
        if (!error && data) requests = data;
      } catch (err) {
        console.warn('[Get mentor inbox] Supabase warning:', err.message);
      }
    }

    if (requests.length === 0) {
      requests = DB.mentorship_requests.filter(r => (r.mentor_user_id || r.mentorId) === mentorId);
    }

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[Get mentor inbox] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve mentor inbox.' });
  }
});

// POST /api/mentorship/requests/:id/respond: Mentor accepts/declines an application
router.post('/requests/:id/respond', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const { status, meetingLink, scheduledAt, mentorFeedback } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const validStatuses = ['Pending Review', 'Confirmed', 'Completed', 'Declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify request exists and belongs to this mentor
    let request = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (!error && data) request = data;
      } catch (err) {}
    }
    if (!request) {
      request = DB.mentorship_requests.find(r => r.id === requestId);
    }
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    const mentorId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    // Check mentor_user_id field (stored during request creation) for authorization
    const requestMentorUserId = request.mentor_user_id || request.mentorId;
    if (requestMentorUserId !== mentorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to respond to this request.' });
    }

    // Update request
    const updatedRequest = {
      ...request,
      status: status.trim(),
      meetingLink: meetingLink ? meetingLink.trim() : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      mentorFeedback: mentorFeedback ? mentorFeedback.trim() : null,
      updatedAt: new Date().toISOString()
    };

    // Save updated request
    let savedRequest;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_requests')
          .update({
            status: updatedRequest.status,
            meeting_link: updatedRequest.meetingLink,
            scheduled_at: updatedRequest.scheduledAt,
            mentor_feedback: updatedRequest.mentorFeedback,
            updated_at: updatedRequest.updatedAt
          })
          .eq('id', requestId)
          .select()
          .single();
        if (!error && data) savedRequest = data;
      } catch (err) {}
    }
    if (!savedRequest) {
      const idx = DB.mentorship_requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        DB.mentorship_requests[idx] = updatedRequest;
        savedRequest = updatedRequest;
      }
    }

    // If accepted, create mentorship relationship
    if (status === 'Confirmed') {
      const relationship = {
        id: `rel-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        applicationId: requestId,
        mentorId: request.mentorId,
        mentorName: request.mentorName,
        menteeId: request.studentId,
        menteeName: request.studentName,
        menteeEmail: request.studentEmail,
        guidanceTrack: request.guidanceTrack,
        status: 'active',
        sessionsCompleted: 0,
        menteeRating: null,
        mentorNotes: mentorFeedback || null,
        startedAt: new Date().toISOString(),
        endedAt: null
      };

      if (isConfigured && supabase) {
        try {
          await supabase.from('mentorship_relationships').insert({
            id: relationship.id,
            application_id: relationship.applicationId,
            mentor_id: relationship.mentorId,
            mentor_name: relationship.mentorName,
            mentee_id: relationship.menteeId,
            mentee_name: relationship.menteeName,
            mentee_email: relationship.menteeEmail,
            guidance_track: relationship.guidanceTrack,
            status: relationship.status,
            sessions_completed: relationship.sessionsCompleted,
            mentee_rating: relationship.menteeRating,
            mentor_notes: relationship.mentorNotes,
            started_at: relationship.startedAt,
            ended_at: relationship.endedAt
          });
        } catch (err) {
          console.warn('[Create relationship] Supabase warning:', err.message);
        }
      }
      DB.mentorship_relationships.unshift(relationship);

      // Increment mentor's mentee count
      if (isConfigured && supabase) {
        try {
          await supabase.from('mentorship_profiles')
            .update({ current_mentee_count: (request.mentor.current_mentee_count || 0) + 1 })
            .eq('id', mentorId);
        } catch (err) {}
      }
      const mentorIdx = DB.mentorship_profiles.findIndex(m => m.id === mentorId);
      if (mentorIdx !== -1) {
        DB.mentorship_profiles[mentorIdx].current_mentee_count = (DB.mentorship_profiles[mentorIdx].current_mentee_count || 0) + 1;
      }
    }

    // Notify student
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    let notificationTitle, notificationMessage;
    if (status === 'Confirmed') {
      notificationTitle = `1-on-1 Guidance Confirmed with ${request.mentorName}`;
      notificationMessage = `Your guidance request on "${request.guidanceTrack}" has been confirmed.`;
      if (meetingLink) notificationMessage += ` Meeting link: ${meetingLink}`;
      if (scheduledAt) notificationMessage += ` Scheduled for: ${new Date(scheduledAt).toLocaleString()}`;

      // Add to student's To-Do docket with XP reward
      if (!DB.todos) DB.todos = [];
      DB.todos.unshift({
        id: `todo-guidance-${Date.now().toString(36)}`,
        studentId: request.studentId,
        title: `Attend 1-on-1 Guidance Session: ${request.guidanceTrack}`,
        description: `Your 1-on-1 guidance session with ${request.mentorName} is confirmed. Prepare your questions and discussion points.`,
        category: 'Guidance',
        priority: 'High',
        dueDate: updatedRequest.scheduledAt || new Date(Date.now() + 86400000 * 2).toISOString(),
        isCompleted: false,
        completedAt: null,
        xpReward: 25,
        sourceType: 'mentorship_confirmed',
        sourceRefId: requestId
      });
    } else if (status === 'Completed') {
      notificationTitle = `1-on-1 Guidance Session Completed`;
      notificationMessage = `Your guidance session on "${request.guidanceTrack}" has been marked as completed.`;
    } else if (status === 'Declined') {
      notificationTitle = `1-on-1 Guidance Request Declined`;
      notificationMessage = `Your guidance request on "${request.guidanceTrack}" was declined by the mentor.`;
    } else {
      notificationTitle = `Guidance Request Status Updated`;
      notificationMessage = `Your guidance request status has been updated to "${status}".`;
    }

    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: request.studentId,
      senderId: mentorId,
      title: notificationTitle,
      message: notificationMessage,
      actionUrl: '/student.html#guidance-requests',
      category: 'mentorship_response',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Guidance request ${status.toLowerCase()} successfully!`,
      request: savedRequest
    });
  } catch (err) {
    console.error('[Respond to mentorship request] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to respond to guidance request.' });
  }
});

// GET /api/mentorship/my-mentorships: Student gets active mentorships
router.get('/my-mentorships', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user?.id || 'usr-student-01';
    let mentorships = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_relationships')
          .select('*')
          .eq('mentee_id', studentId)
          .order('started_at', { ascending: false });
        if (!error && data) mentorships = data;
      } catch (err) {}
    }
    if (mentorships.length === 0) {
      mentorships = DB.mentorship_relationships.filter(r => r.menteeId === studentId);
    }

    return res.json({ success: true, mentorships });
  } catch (err) {
    console.error('[Get my mentorships] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve mentorships.' });
  }
});

// GET /api/mentorship/my-mentees: Mentor gets active mentees
router.get('/my-mentees', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const mentorId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');
    let mentorships = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_relationships')
          .select('*')
          .eq('mentor_id', mentorId)
          .order('started_at', { ascending: false });
        if (!error && data) mentorships = data;
      } catch (err) {}
    }
    if (mentorships.length === 0) {
      mentorships = DB.mentorship_relationships.filter(r => r.mentorId === mentorId);
    }

    return res.json({ success: true, mentorships });
  } catch (err) {
    console.error('[Get my mentees] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve mentees.' });
  }
});

// POST /api/mentorship/sessions: Request a new 1-on-1 session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { mentorshipId, agenda, preferredSlot } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!mentorshipId || !agenda || !preferredSlot) {
      return res.status(400).json({ success: false, error: 'Mentorship ID, agenda, and preferred slot are required.' });
    }

    // Verify mentorship exists and user is part of it
    let relationship = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_relationships').select('*').eq('id', mentorshipId).maybeSingle();
        relationship = data;
      } catch (err) {}
    }
    if (!relationship) {
      relationship = DB.mentorship_relationships.find(r => r.id === mentorshipId);
    }
    if (!relationship) {
      return res.status(404).json({ success: false, error: 'Mentorship relationship not found.' });
    }

    const isMentee = relationship.menteeId === userId;
    const isMentor = relationship.mentorId === userId;
    if (!isMentee && !isMentor) {
      return res.status(403).json({ success: false, error: 'Not authorized for this mentorship.' });
    }
    if (relationship.status !== 'active') {
      return res.status(409).json({ success: false, error: 'Can only request sessions for active mentorships.' });
    }

    const newSession = {
      id: `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      relationshipId: mentorshipId,
      requestedBy: isMentee ? 'mentee' : 'mentor',
      agenda: agenda.trim(),
      preferredSlot: preferredSlot.trim(),
      scheduledAt: null,
      meetingLink: null,
      status: 'Requested',
      sessionNotes: null,
      createdAt: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_sessions').insert({
          id: newSession.id,
          relationship_id: newSession.relationshipId,
          requested_by: newSession.requestedBy,
          agenda: newSession.agenda,
          preferred_slot: newSession.preferredSlot,
          scheduled_at: newSession.scheduledAt,
          meeting_link: newSession.meetingLink,
          status: newSession.status,
          session_notes: newSession.sessionNotes,
          created_at: newSession.createdAt
        });
      } catch (err) {}
    }
    DB.mentorship_sessions.unshift(newSession);

    // Notify the other party
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    const recipientId = isMentee ? relationship.mentorId : relationship.menteeId;
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId,
      senderId: userId,
      title: `New Session Request: ${agenda}`,
      message: `${isMentee ? relationship.menteeName : relationship.mentorName} requested a 1-on-1 session. Preferred: ${preferredSlot}`,
      actionUrl: `/${isMentee ? 'academy' : 'student'}.html#mentorship-sessions`,
      category: 'session_request',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, message: 'Session requested!', session: newSession });
  } catch (err) {
    console.error('[Request session] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to request session.' });
  }
});

// POST /api/mentorship/sessions/:id/schedule: Mentor confirms session with time/link
router.post('/sessions/:id/schedule', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { scheduledAt, meetingLink } = req.body;
    const mentorId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');

    if (!scheduledAt || !meetingLink) {
      return res.status(400).json({ success: false, error: 'Scheduled time and meeting link are required.' });
    }

    let session = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_sessions').select('*').eq('id', sessionId).maybeSingle();
        session = data;
      } catch (err) {}
    }
    if (!session) {
      session = DB.mentorship_sessions.find(s => s.id === sessionId);
    }
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Verify mentor owns this mentorship
    let relationship = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_relationships').select('*').eq('id', session.relationshipId).maybeSingle();
        relationship = data;
      } catch (err) {}
    }
    if (!relationship) {
      relationship = DB.mentorship_relationships.find(r => r.id === session.relationshipId);
    }
    if (!relationship || relationship.mentorId !== mentorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to schedule this session.' });
    }

    // Update session
    const updatedSession = {
      ...session,
      scheduledAt: new Date(scheduledAt).toISOString(),
      meetingLink: meetingLink.trim(),
      status: 'Scheduled',
      updatedAt: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_sessions').update({
          scheduled_at: updatedSession.scheduledAt,
          meeting_link: updatedSession.meetingLink,
          status: updatedSession.status,
          updated_at: updatedSession.updatedAt
        }).eq('id', sessionId);
      } catch (err) {}
    }
    const sessIdx = DB.mentorship_sessions.findIndex(s => s.id === sessionId);
    if (sessIdx !== -1) DB.mentorship_sessions[sessIdx] = updatedSession;

    // Notify student
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: relationship.menteeId,
      senderId: mentorId,
      title: `1-on-1 Session Scheduled: ${session.agenda}`,
      message: `Your session with ${relationship.mentorName} is confirmed for ${new Date(scheduledAt).toLocaleString()}. Meeting link: ${meetingLink}`,
      actionUrl: '/student.html#mentorship-sessions',
      category: 'session_scheduled',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Add to student's To-Do
    if (!DB.todos) DB.todos = [];
    DB.todos.unshift({
      id: `todo-session-${Date.now().toString(36)}`,
      studentId: relationship.menteeId,
      title: `Attend 1-on-1 Session: ${session.agenda}`,
      description: `1-on-1 guidance session with ${relationship.mentorName}. Meeting link: ${meetingLink}`,
      category: 'Guidance',
      priority: 'High',
      dueDate: updatedSession.scheduledAt,
      isCompleted: false,
      completedAt: null,
      xpReward: 25,
      sourceType: 'mentorship_session',
      sourceRefId: sessionId
    });

    return res.json({ success: true, message: 'Session scheduled!', session: updatedSession });
  } catch (err) {
    console.error('[Schedule session] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to schedule session.' });
  }
});

// POST /api/mentorship/sessions/:id/complete: Mark session as completed
router.post('/sessions/:id/complete', authenticateToken, requireRole(['academy', 'industry']), async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { sessionNotes } = req.body;
    const mentorId = req.user?.id || (req.user.role === 'academy' ? 'usr-academy-01' : 'usr-industry-01');

    let session = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_sessions').select('*').eq('id', sessionId).maybeSingle();
        session = data;
      } catch (err) {}
    }
    if (!session) {
      session = DB.mentorship_sessions.find(s => s.id === sessionId);
    }
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Verify mentor owns this mentorship
    let relationship = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_relationships').select('*').eq('id', session.relationshipId).maybeSingle();
        relationship = data;
      } catch (err) {}
    }
    if (!relationship) {
      relationship = DB.mentorship_relationships.find(r => r.id === session.relationshipId);
    }
    if (!relationship || relationship.mentorId !== mentorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to complete this session.' });
    }

    // Update session
    const updatedSession = {
      ...session,
      status: 'Completed',
      sessionNotes: sessionNotes ? sessionNotes.trim() : null,
      completedAt: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_sessions').update({
          status: updatedSession.status,
          session_notes: updatedSession.sessionNotes,
          completed_at: updatedSession.completedAt
        }).eq('id', sessionId);
      } catch (err) {}
    }
    const sessIdx = DB.mentorship_sessions.findIndex(s => s.id === sessionId);
    if (sessIdx !== -1) DB.mentorship_sessions[sessIdx] = updatedSession;

    // Increment sessions completed in relationship
    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_relationships').update({
          sessions_completed: (relationship.sessionsCompleted || 0) + 1
        }).eq('id', relationship.id);
      } catch (err) {}
    }
    const relIdx = DB.mentorship_relationships.findIndex(r => r.id === relationship.id);
    if (relIdx !== -1) {
      DB.mentorship_relationships[relIdx].sessionsCompleted = (DB.mentorship_relationships[relIdx].sessionsCompleted || 0) + 1;
    }

    // Increment mentor's total sessions
    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_profiles').update({
          total_sessions_completed: (relationship.mentor?.total_sessions_completed || 0) + 1
        }).eq('id', mentorId);
      } catch (err) {}
    }
    const mentorIdx = DB.mentorship_profiles.findIndex(m => m.id === mentorId);
    if (mentorIdx !== -1) {
      DB.mentorship_profiles[mentorIdx].total_sessions_completed = (DB.mentorship_profiles[mentorIdx].total_sessions_completed || 0) + 1;
    }

    return res.json({ success: true, message: 'Session marked as completed!', session: updatedSession });
  } catch (err) {
    console.error('[Complete session] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to complete session.' });
  }
});

// POST /api/mentorship/relationships/:id/end: End an active mentorship
router.post('/relationships/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id: relationshipId } = req.params;
    const { menteeRating } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let relationship = null;
    if (isConfigured && supabase) {
      try {
        const { data } = await supabase.from('mentorship_relationships').select('*').eq('id', relationshipId).maybeSingle();
        relationship = data;
      } catch (err) {}
    }
    if (!relationship) {
      relationship = DB.mentorship_relationships.find(r => r.id === relationshipId);
    }
    if (!relationship) {
      return res.status(404).json({ success: false, error: 'Mentorship relationship not found.' });
    }

    const isMentee = relationship.menteeId === userId;
    const isMentor = relationship.mentorId === userId;
    if (!isMentee && !isMentor) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this mentorship.' });
    }

    // Update relationship
    const updatedRelationship = {
      ...relationship,
      status: 'completed',
      endedAt: new Date().toISOString(),
      menteeRating: menteeRating ? Number(menteeRating) : null
    };

    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_relationships').update({
          status: updatedRelationship.status,
          ended_at: updatedRelationship.endedAt,
          mentee_rating: updatedRelationship.menteeRating
        }).eq('id', relationshipId);
      } catch (err) {}
    }
    const relIdx = DB.mentorship_relationships.findIndex(r => r.id === relationshipId);
    if (relIdx !== -1) DB.mentorship_relationships[relIdx] = updatedRelationship;

    // Decrement mentor's mentee count
    if (isConfigured && supabase) {
      try {
        await supabase.from('mentorship_profiles').update({
          current_mentee_count: Math.max(0, (relationship.mentor?.current_mentee_count || 1) - 1)
        }).eq('id', relationship.mentorId);
      } catch (err) {}
    }
    const mentorIdx = DB.mentorship_profiles.findIndex(m => m.id === relationship.mentorId);
    if (mentorIdx !== -1) {
      DB.mentorship_profiles[mentorIdx].current_mentee_count = Math.max(0, (DB.mentorship_profiles[mentorIdx].current_mentee_count || 1) - 1);
    }

    // Notify other party
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    const recipientId = isMentee ? relationship.mentorId : relationship.menteeId;
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId,
      senderId: userId,
      title: `Mentorship Ended: ${relationship.guidanceTrack}`,
      message: `Your mentorship relationship on "${relationship.guidanceTrack}" has been ended.`,
      actionUrl: isMentee ? '/student.html#guidance-requests' : `/${isMentee ? 'academy' : 'industry'}.html#mentorship-inbox`,
      category: 'mentorship_ended',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Mentorship ended successfully!', relationship: updatedRelationship });
  } catch (err) {
    console.error('[End mentorship] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to end mentorship.' });
  }
});

module.exports = router;