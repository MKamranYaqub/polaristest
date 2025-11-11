import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// ============= ADMIN USER MANAGEMENT ENDPOINTS =============

// GET /api/auth/users - List all users (Admin only)
router.get('/users', authenticateToken, requireAccessLevel(1), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, access_level, is_active, created_at, last_login, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: error.message || 'Failed to list users' });
  }
});

// POST /api/auth/users - Create new user (Admin only)
router.post('/users', authenticateToken, requireAccessLevel(1), async (req, res) => {
  try {
    const { email, password, name, access_level } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!access_level || access_level < 1 || access_level > 5) {
      return res.status(400).json({ error: 'Valid access level (1-5) is required' });
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

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        name: name || email.split('@')[0],
        access_level,
      })
      .select('id, email, name, access_level, created_at, is_active')
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'USER_CREATED',
      table_name: 'users',
      record_id: newUser.id,
      new_values: { email: newUser.email, access_level: newUser.access_level, created_by: req.user.email }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// PATCH /api/auth/users/:id - Update user (Admin only)
router.patch('/users/:id', authenticateToken, requireAccessLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, access_level, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (access_level !== undefined) {
      if (access_level < 1 || access_level > 5) {
        return res.status(400).json({ error: 'Access level must be between 1 and 5' });
      }
      updates.access_level = access_level;
    }
    if (is_active !== undefined) updates.is_active = is_active;
    
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Prevent admin from deactivating themselves
    if (is_active === false && id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, name, access_level, is_active, created_at, last_login')
      .single();

    if (error) throw error;

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'USER_UPDATED',
      table_name: 'users',
      record_id: id,
      new_values: { ...updates, updated_by: req.user.email }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// DELETE /api/auth/users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAccessLevel(1), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get user info before deletion for audit log
    const { data: userToDelete } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', id)
      .single();

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'USER_DELETED',
      table_name: 'users',
      record_id: id,
      new_values: { deleted_user: userToDelete.email, deleted_by: req.user.email }
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// POST /api/auth/users/:id/reset-password - Admin reset user password
router.post('/users/:id/reset-password', authenticateToken, requireAccessLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password
    await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'PASSWORD_RESET_BY_ADMIN',
      table_name: 'users',
      record_id: id,
      new_values: { reset_for: user.email, reset_by: req.user.email }
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

// ============= FORGOT PASSWORD FLOW =============

// POST /api/auth/request-password-reset - Request password reset token
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success message (don't reveal if email exists)
    // This prevents email enumeration attacks
    const successMessage = 'If an account exists with this email, a password reset link has been generated.';

    if (error || !user) {
      // Don't reveal that user doesn't exist
      return res.json({
        success: true,
        message: successMessage,
      });
    }

    if (!user.is_active) {
      // Don't reveal that account is inactive
      return res.json({
        success: true,
        message: successMessage,
      });
    }

    // Generate secure reset token (UUID v4)
    const resetToken = crypto.randomUUID();
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await supabase
      .from('users')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      table_name: 'users',
      record_id: user.id,
      new_values: { email: user.email }
    });

    // In a real application, you would send an email here with the reset link
    // For now, we'll return the token in the response (for development/testing)
    // IMPORTANT: Remove this in production and use email service instead
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    res.json({
      success: true,
      message: successMessage,
      // DEVELOPMENT ONLY - Remove in production
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: error.message || 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user by reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_reset_expires, is_active')
      .eq('password_reset_token', token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);

    if (now > expiresAt) {
      // Clear expired token
      await supabase
        .from('users')
        .update({
          password_reset_token: null,
          password_reset_expires: null,
        })
        .eq('id', user.id);

      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password and clear reset token
    await supabase
      .from('users')
      .update({
        password_hash,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      table_name: 'users',
      record_id: user.id,
      new_values: { email: user.email }
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

// GET /api/auth/validate-reset-token/:token - Validate if reset token is valid
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find user by reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_reset_expires')
      .eq('password_reset_token', token)
      .single();

    if (error || !user) {
      return res.json({
        valid: false,
        error: 'Invalid reset token',
      });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.password_reset_expires);

    if (now > expiresAt) {
      return res.json({
        valid: false,
        error: 'Reset token has expired',
      });
    }

    res.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ error: error.message || 'Failed to validate token' });
  }
});

export default router;
