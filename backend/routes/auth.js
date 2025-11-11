import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check required access level
export const requireAccessLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Lower access_level number = higher permission (1=Admin is highest)
    if (req.user.access_level > minLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: minLevel,
        current: req.user.access_level
      });
    }
    
    next();
  };
};

// POST /api/auth/register - Create new user account
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, access_level } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (access_level && (access_level < 1 || access_level > 5)) {
      return res.status(400).json({ error: 'Access level must be between 1 and 5' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Default access level: 4 (Underwriter) - most restricted
    const userAccessLevel = access_level || 4;

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        name: name || email.split('@')[0],
        access_level: userAccessLevel,
      })
      .select('id, email, name, access_level, created_at')
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: newUser.id,
      action: 'USER_REGISTERED',
      table_name: 'users',
      record_id: newUser.id,
      new_values: { email: newUser.email, access_level: newUser.access_level }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        access_level: newUser.access_level,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'USER_LOGIN',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        access_level: user.access_level,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send password hash to client
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, access_level, created_at, last_login')
      .eq('id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user info' });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get current user with password hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash: new_password_hash, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'PASSWORD_CHANGED',
      table_name: 'users',
      record_id: req.user.id
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

// GET /api/auth/access-levels - Get list of access levels (for admin reference)
router.get('/access-levels', authenticateToken, requireAccessLevel(1), (req, res) => {
  res.json({
    success: true,
    access_levels: {
      1: { name: 'Admin', permissions: 'Full access to everything' },
      2: { name: 'UW Team Lead', permissions: 'Edit calculators, rates, constants, criteria' },
      3: { name: 'Head of UW', permissions: 'Edit calculators, rates, constants, criteria' },
      4: { name: 'Underwriter', permissions: 'Access calculators and quotes only (read-only)' },
      5: { name: 'Product Team', permissions: 'Edit rates, constants, and criteria' },
    },
  });
});

export default router;
