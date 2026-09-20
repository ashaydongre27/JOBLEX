/**
 * JOBLEX Authentication & Role Authorization Middleware
 * Compatible with Supabase JWT Bearer Tokens
 */

const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');

/**
 * Authenticate incoming request via Supabase Bearer JWT Token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No Bearer token provided.'
    });
  }

  // 1. Try Supabase Auth verification if configured
  if (isConfigured && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const userEmail = user.email || '';
        req.user = {
          id: user.id,
          email: userEmail,
          role: user.user_metadata?.role || 'student',
          name: user.user_metadata?.name || (userEmail ? userEmail.split('@')[0] : 'User'),
          institution: user.user_metadata?.institution,
          company: user.user_metadata?.company,
          metadata: user.user_metadata
        };
        return next();
      }
    } catch (err) {
      console.warn('[Auth Middleware] Supabase verification error:', err.message);
    }
  }

  // 2. Fallback local token verification for demo sessions (only for known demo accounts)
  if ((token.startsWith('jwt-') || token.startsWith('demo-')) && Array.isArray(DB.users)) {
    const matchedUser = DB.users.find(u => {
      const emailPrefix = u.email ? u.email.split('@')[0].toLowerCase() : '';
      return (u.id && token.includes(u.id)) || (emailPrefix && token.toLowerCase().includes(emailPrefix));
    });

    if (matchedUser) {
      const { password: _, ...safeUser } = matchedUser;
      req.user = safeUser;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid or expired authentication token.'
  });
}

/**
 * Enforce role-based access control
 * @param {string[]} allowedRoles Array of permitted roles (e.g. ['academy', 'admin'])
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const isAcademyPermitted = normalizedAllowed.includes('academy') || normalizedAllowed.includes('academician') || normalizedAllowed.includes('faculty');
    const isUserAcademyRole = userRole === 'academy' || userRole === 'academician' || userRole === 'faculty';

    const hasRole = normalizedAllowed.includes(userRole) || (isAcademyPermitted && isUserAcademyRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden. Required role: [${allowedRoles.join(', ')}]. Your role: ${userRole}.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
