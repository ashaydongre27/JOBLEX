/**
 * JOBLEX Supabase Authentication & Multi-Role System
 * Supports: student, academy, industry, admin
 */

const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.middleware');
const DB = require('../data/database');

// Users are managed dynamically via Supabase Auth and Profiles table (no hardcoded accounts)

/**
 * POST /api/auth/register
 * Registers new user via Supabase Auth + metadata
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role, institution, company, department, designation, year, employee_uid, employee_id } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Name, Email, and Password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userRole = (role || 'student').toLowerCase();
  const allowedRoles = ['student', 'academy', 'academician', 'faculty', 'industry', 'admin'];

  if (!allowedRoles.includes(userRole)) {
    return res.status(400).json({ success: false, error: `Invalid role: ${userRole}. Must be one of [student, academy, academician, faculty, industry].` });
  }

  const resolvedCompany = userRole === 'industry' ? (company || institution || 'Corporate Partner Enterprise') : null;
  const resolvedInstitution = userRole === 'industry' ? null : (institution || 'Accredited Higher Education Institution');
  const resolvedDept = userRole === 'industry' ? null : (department || (userRole === 'student' ? 'General Academic Studies' : 'Academic Faculty'));
  const resolvedYear = userRole === 'student' ? (year || '1st Year') : null;
  const empUid = employee_uid || employee_id || null;

  // 1. Live Supabase Auth Registration
  if (isConfigured && supabase) {
    try {
      let data = null;
      let error = null;

      if (supabase.auth?.admin?.createUser) {
        const adminRes = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name,
            role: userRole,
            institution: resolvedInstitution,
            company: resolvedCompany,
            employee_uid: empUid,
            department: resolvedDept,
            designation: designation || (userRole === 'industry' ? 'Industry Representative' : null),
            year: resolvedYear
          }
        });
        data = adminRes.data;
        error = adminRes.error;
      }

      if (!data?.user) {
        const standardRes = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            data: {
              name,
              role: userRole,
              institution: resolvedInstitution,
              company: resolvedCompany,
              employee_uid: empUid,
              department: resolvedDept,
              designation: designation || (userRole === 'industry' ? 'Industry Representative' : null),
              year: resolvedYear
            }
          }
        });
        data = standardRes.data;
        error = standardRes.error;
      }

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      // Upsert profile into public.profiles
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name,
            email: normalizedEmail,
            role: userRole,
            institution: resolvedInstitution,
            company: resolvedCompany,
            employee_uid: empUid,
            department: resolvedDept,
            designation: designation || null,
            year: resolvedYear,
            xp: 0,
            streak: 0,
            verified_skills: [],
            is_onboarding_completed: false,
            onboarding_completed: false
          });
        } catch (dbErr) {
          console.warn('[Register] Profile table upsert notice:', dbErr.message);
        }
      }

      const isStudent = userRole === 'student';
      const fullUserObj = {
        id: data.user.id,
        name,
        email: normalizedEmail,
        role: userRole,
        institution: resolvedInstitution,
        company: resolvedCompany,
        employee_uid: empUid,
        department: resolvedDept,
        designation: designation || null,
        year: resolvedYear,
        xp: 0,
        streak: 0,
        verified_skills: [],
        avatar_url: null,
        isOnboardingCompleted: false,
        onboarding_completed: false
      };

      // Ensure access token is issued immediately upon registration (zero re-login friction)
      let token = data.session?.access_token;
      if (!token && supabase.auth?.signInWithPassword) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: password
          });
          if (signInRes.data?.session?.access_token) {
            token = signInRes.data.session.access_token;
          }
        } catch (signInErr) {
          console.warn('[Register] Automatic sign-in attempt notice:', signInErr.message);
        }
      }

      if (!token) {
        token = `jwt-${data.user.id}-${Date.now()}`;
      }

      // Mirror user in memory store for session resolution
      const mirrorUser = {
        ...fullUserObj,
        password: password
      };
      const existingUserIdx = DB.users.findIndex(u => u.id === data.user.id || u.email.toLowerCase() === normalizedEmail);
      if (existingUserIdx >= 0) {
        DB.users[existingUserIdx] = mirrorUser;
      } else {
        DB.users.push(mirrorUser);
      }

      return res.status(201).json({
        success: true,
        message: 'User registered and authenticated successfully!',
        user: fullUserObj,
        token: token
      });
    } catch (err) {
      console.warn('[Register] Supabase error, falling back to local store:', err.message);
    }
  }

  // 2. Local Fallback Registration
  const existing = DB.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Email already registered.' });
  }

  const isStudent = userRole === 'student';
  const newUser = {
    id: `usr-${Date.now().toString(36)}`,
    name,
    email: normalizedEmail,
    password: password || 'password123',
    role: userRole,
    institution: resolvedInstitution,
    company: resolvedCompany,
    employee_uid: empUid,
    department: resolvedDept,
    designation: designation || null,
    year: resolvedYear,
    xp: 0,
    streak: 0,
    verified_skills: [],
    avatar_url: null,
    isOnboardingCompleted: false,
    onboarding_completed: false
  };
  DB.users.push(newUser);

  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({
    success: true,
    message: 'User registered successfully!',
    user: safeUser,
    token: `jwt-${newUser.id}-${Date.now()}`
  });
});

/**
 * POST /api/auth/login
 * Authenticates user via Supabase Auth or verified demo accounts
 */
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  // 1. Live Supabase Auth Login
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });

      if (!error && data?.user) {
        let userProfile = data.user.user_metadata || {};
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profile) userProfile = { ...userProfile, ...profile };
        } catch(e) {}

        const userRole = userProfile.role || role || 'student';
        if (role && userRole.toLowerCase() !== role.toLowerCase()) {
          return res.status(400).json({
            success: false,
            error: `Account Role Mismatch: This account is registered as a ${userRole.toUpperCase()} account, not a ${role.toUpperCase()} account.`
          });
        }
        const isStudent = userRole === 'student';
        const isOnboarded = !isStudent || Boolean(userProfile.isOnboardingCompleted ?? userProfile.onboarding_completed ?? userProfile.is_onboarding_completed);

        const userObj = {
          id: data.user.id,
          email: data.user.email,
          role: userRole,
          name: userProfile.name || normalizedEmail.split('@')[0],
          institution: userProfile.institution || (userProfile.role === 'industry' ? null : 'Accredited Higher Education Institution'),
          company: userProfile.company || (userProfile.role === 'industry' ? 'Corporate Partner Enterprise' : null),
          department: userProfile.department || (userProfile.role === 'student' ? 'General Academic & Technical Studies' : 'Academic Faculty'),
          designation: userProfile.designation || null,
          year: userProfile.year || '1st Year',
          xp: userProfile.xp !== undefined ? userProfile.xp : 0,
          streak: userProfile.streak !== undefined ? userProfile.streak : 0,
          decay_frozen_until: userProfile.decay_frozen_until || null,
          verified_skills: userProfile.verified_skills || [],
          avatar_url: userProfile.avatar_url || null,
          isOnboardingCompleted: isOnboarded,
          onboarding_completed: isOnboarded,
          student_profile: userProfile.student_profile || userProfile.onboarding_data || null
        };

        if (!data.session?.access_token) {
          return res.status(401).json({ success: false, error: 'Login succeeded but no access token was issued. Please try again.' });
        }

        return res.json({
          success: true,
          message: 'Authenticated via Supabase Auth',
          token: data.session.access_token,
          user: userObj
        });
      }

      if (error && error.message?.toLowerCase().includes('not confirmed') && supabase.auth?.admin?.listUsers) {
        try {
          const list = await supabase.auth.admin.listUsers();
          const existingUser = list.data?.users?.find(u => u.email === normalizedEmail);
          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
            const retryRes = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: password
            });
            if (!retryRes.error && retryRes.data?.user) {
              const retryData = retryRes.data;
              let userProfile = retryData.user.user_metadata || {};
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', retryData.user.id)
                  .single();
                if (profile) userProfile = { ...userProfile, ...profile };
              } catch(e) {}

              const userRole = userProfile.role || role || 'student';
              if (role && userRole.toLowerCase() !== role.toLowerCase()) {
                return res.status(400).json({
                  success: false,
                  error: `Account Role Mismatch: This account is registered as a ${userRole.toUpperCase()} account, not a ${role.toUpperCase()} account.`
                });
              }
              const isStudent = userRole === 'student';
              const isOnboarded = !isStudent || Boolean(userProfile.isOnboardingCompleted ?? userProfile.onboarding_completed ?? userProfile.is_onboarding_completed);

              const userObj = {
                id: retryData.user.id,
                email: retryData.user.email,
                role: userRole,
                name: userProfile.name || normalizedEmail.split('@')[0],
                institution: userProfile.institution || (userProfile.role === 'industry' ? null : 'Accredited Higher Education Institution'),
                company: userProfile.company || (userProfile.role === 'industry' ? 'Corporate Partner Enterprise' : null),
                department: userProfile.department || (userProfile.role === 'student' ? 'General Academic & Technical Studies' : 'Academic Faculty'),
                designation: userProfile.designation || null,
                year: userProfile.year || '1st Year',
                xp: userProfile.xp !== undefined ? userProfile.xp : 0,
                streak: userProfile.streak !== undefined ? userProfile.streak : 0,
                decay_frozen_until: userProfile.decay_frozen_until || null,
                verified_skills: userProfile.verified_skills || [],
                avatar_url: userProfile.avatar_url || null,
                isOnboardingCompleted: isOnboarded,
                onboarding_completed: isOnboarded,
                student_profile: userProfile.student_profile || userProfile.onboarding_data || null
              };

              if (!retryData.session?.access_token) {
                return res.status(401).json({ success: false, error: 'Login succeeded but no access token was issued. Please try again.' });
              }

              return res.json({
                success: true,
                message: 'Authenticated via Supabase Auth',
                token: retryData.session.access_token,
                user: userObj
              });
            }
          }
        } catch (confirmErr) {
          console.warn('[Login] Auto-confirm error:', confirmErr.message);
        }
      }

      if (error) {
        // Fallback for seed demo accounts if not yet registered in live Supabase instance
        const seedUser = DB.users?.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
        if (seedUser) {
          if (role && seedUser.role !== role.toLowerCase()) {
            return res.status(400).json({ success: false, error: `Account Role Mismatch: This account is registered as a ${seedUser.role.toUpperCase()} account, not a ${role.toUpperCase()} account.` });
          }
          const { password: _, ...safeUser } = seedUser;
          const isStudent = seedUser.role === 'student';
          safeUser.isOnboardingCompleted = !isStudent || Boolean(seedUser.isOnboardingCompleted ?? seedUser.onboarding_completed);
          safeUser.onboarding_completed = safeUser.isOnboardingCompleted;
          safeUser.student_profile = seedUser.student_profile || seedUser.onboarding_data || null;

          return res.json({
            success: true,
            message: 'Authenticated via Verified Demo Account',
            token: `jwt-demo-${seedUser.id}-${Date.now()}`,
            user: safeUser
          });
        }
        return res.status(401).json({ success: false, error: 'Invalid email or password. Please verify your credentials or register.' });
      }
    } catch (err) {
      console.warn('[Login] Supabase error:', err.message);
      const seedUser = DB.users?.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
      if (seedUser) {
        const { password: _, ...safeUser } = seedUser;
        const isStudent = seedUser.role === 'student';
        safeUser.isOnboardingCompleted = !isStudent || Boolean(seedUser.isOnboardingCompleted ?? seedUser.onboarding_completed);
        safeUser.onboarding_completed = safeUser.isOnboardingCompleted;
        safeUser.student_profile = seedUser.student_profile || seedUser.onboarding_data || null;

        return res.json({
          success: true,
          message: 'Authenticated via Verified Demo Account',
          token: `jwt-demo-${seedUser.id}-${Date.now()}`,
          user: safeUser
        });
      }
      return res.status(401).json({ success: false, error: 'Authentication failed. Please verify your credentials.' });
    }
  }

  // 2. Strict verification for local/offline mode (if Supabase not reachable)
  const user = DB.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password. Please check your credentials.' });
  }

  if (role && user.role !== role.toLowerCase()) {
    return res.status(400).json({ success: false, error: `Account Role Mismatch: This account is registered as a ${user.role.toUpperCase()} account, not a ${role.toUpperCase()} account.` });
  }

  const { password: _, ...safeUser } = user;
  const isStudent = user.role === 'student';
  safeUser.isOnboardingCompleted = !isStudent || Boolean(user.isOnboardingCompleted ?? user.onboarding_completed);
  safeUser.onboarding_completed = safeUser.isOnboardingCompleted;
  safeUser.student_profile = user.student_profile || user.onboarding_data || null;

  return res.json({
    success: true,
    message: 'Login successful!',
    token: `jwt-${user.id}-${Date.now()}`,
    user: safeUser
  });
});

/**
 * GET /api/auth/profile
 * Returns profile details for logged in email/id
 */
router.get('/profile', async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  const id = req.query.id;

  const syncProfileStudentDossier = (prof) => {
    if (!prof) return prof;
    const sp = prof.student_profile || prof.onboarding_data;
    if (sp && typeof sp === 'object') {
      if (prof.name && (!sp.fullName || sp.fullName !== prof.name)) sp.fullName = prof.name;
      if (prof.institution && (!sp.college || sp.college !== prof.institution)) sp.college = prof.institution;
      if (prof.department && (!sp.specialization || sp.specialization !== prof.department)) sp.specialization = prof.department;
      if (prof.year && (!sp.currentSemester || sp.currentSemester !== prof.year)) sp.currentSemester = prof.year;
      prof.student_profile = sp;
      prof.onboarding_data = sp;
    }
    return prof;
  };

  if (isConfigured && supabase) {
    try {
      let query = supabase.from('profiles').select('*');
      if (id) query = query.eq('id', id);
      else if (email) query = query.eq('email', email);

      const { data: profile } = await query.single();
      if (profile) {
        const isStudent = (profile.role || '').toLowerCase() === 'student';
        const isOnboarded = !isStudent || Boolean(profile.isOnboardingCompleted ?? profile.onboarding_completed ?? profile.is_onboarding_completed);
        profile.isOnboardingCompleted = isOnboarded;
        profile.onboarding_completed = isOnboarded;
        return res.json({ success: true, profile: syncProfileStudentDossier(profile) });
      }
    } catch (e) {}
  }

  const user = DB.users.find(u => (id && u.id === id) || (email && u.email.toLowerCase() === email));
  if (user) {
    const { password: _, ...safeProfile } = user;
    return res.json({ success: true, profile: syncProfileStudentDossier(safeProfile) });
  }
  return res.json({ success: true, profile: null });
});

/**
 * PUT /api/auth/profile
 * Updates user profile details in public.profiles
 */
router.put('/profile', async (req, res) => {
  const { id, email, name, institution, company, department, designation, year, verified_skills, avatar_url, student_profile } = req.body || {};

  if (!id && !email) {
    return res.status(400).json({ success: false, error: 'User ID or Email required to update profile.' });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (institution !== undefined) updates.institution = institution;
  if (company !== undefined) updates.company = company;
  if (department !== undefined) updates.department = department;
  if (designation !== undefined) updates.designation = designation;
  if (year !== undefined) updates.year = year;
  if (verified_skills !== undefined) updates.verified_skills = verified_skills;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  updates.updated_at = new Date().toISOString();

  // Find local user for bidirectional sync
  const user = DB.users.find(u => (id && u.id === id) || (email && u.email.toLowerCase() === email.trim().toLowerCase()));

  // Mirror root-level profile changes into student_profile jsonb object
  let currentStudentProfile = user?.student_profile || user?.onboarding_data || {};
  if (typeof currentStudentProfile !== 'object' || currentStudentProfile === null) {
    currentStudentProfile = {};
  }
  let spChanged = false;
  if (updates.name) {
    currentStudentProfile = { ...currentStudentProfile, fullName: updates.name, name: updates.name };
    spChanged = true;
  }
  if (updates.institution) {
    currentStudentProfile = { ...currentStudentProfile, college: updates.institution, collegeName: updates.institution };
    spChanged = true;
  }
  if (updates.department) {
    currentStudentProfile = { ...currentStudentProfile, specialization: updates.department, department: updates.department };
    spChanged = true;
  }
  if (updates.year) {
    currentStudentProfile = { ...currentStudentProfile, currentSemester: updates.year, year: updates.year };
    spChanged = true;
  }
  if (updates.verified_skills) {
    currentStudentProfile = { ...currentStudentProfile, skills: updates.verified_skills, verifiedSkills: updates.verified_skills };
    spChanged = true;
  }

  if (spChanged || student_profile) {
    const mergedSp = { ...currentStudentProfile, ...(student_profile || {}) };
    updates.student_profile = mergedSp;
    updates.onboarding_data = mergedSp;
  }

  if (isConfigured && supabase) {
    try {
      let query = supabase.from('profiles').update(updates);
      if (id) query = query.eq('id', id);
      else if (email) query = query.eq('email', email.trim().toLowerCase());

      const { data, error } = await query.select().single();
      if (!error && data) {
        if (user) {
          Object.assign(user, updates);
        }
        return res.json({ success: true, message: 'Profile updated successfully!', profile: data });
      }
    } catch (e) {}
  }

  if (user) {
    Object.assign(user, updates);
    const { password: _, ...safeProfile } = user;
    return res.json({ success: true, message: 'Profile updated successfully!', profile: safeProfile });
  }

  return res.status(404).json({ success: false, error: 'Profile not found.' });
});

/**
 * GET /api/auth/me
 * Protected endpoint returning currently authenticated user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/logout
 * Signs out Supabase session
 */
router.post('/logout', async (req, res) => {
  if (isConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch(e) {}
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/reset-password or /api/auth/forgot-password
 * Dispatches Supabase password reset email
 */
router.post(['/reset-password', '/forgot-password'], async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        console.warn('[Reset Password] Supabase warning:', error.message);
        // Supabase rate limits or invalid emails should still return a friendly message
        return res.status(400).json({ success: false, error: error.message });
      }
    } catch(err) {
      console.warn('[Reset Password] Supabase error:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Password reset instructions dispatched to ${normalizedEmail}. Please check your inbox or spam folder.`
  });
});

module.exports = router;
