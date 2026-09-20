/**
 * JOBLEX Student Contextual To-Do & Task Management Routes (Node.js / Express)
 * Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
 */

const express = require('express');
const router = express.Router();
const DB = require('../data/database');
const { supabase, isConfigured } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken, requireRole(['student']));

function ensureTodos() {
  if (!DB.todos) {
    DB.todos = [];
  }
  return DB.todos;
}

/**
 * GET /api/todos
 * Returns active and completed tasks for the current student
 */
router.get('/', async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('student_todos')
          .select('*')
          .eq('student_id', studentId)
          .order('due_date', { ascending: true, nullsFirst: false });

        if (!error && data) {
          return res.json({ success: true, todos: data });
        }
      } catch (err) {
        console.warn('[Todos GET] Supabase warning:', err.message);
      }
    }

    const todos = studentId ? ensureTodos().filter(t => t.studentId === studentId) : [];
    return res.json({ success: true, todos });
  } catch (err) {
    console.error('[Todos GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/todos
 * Creates a new personal or academic task
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      category = 'Personal',
      priority = 'Medium',
      dueDate = null,
      studentId: _ignoredStudentId
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required.' });
    }

    const studentId = req.user?.id || req.user?.email;
    const newTodo = {
      id: `todo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      title: title.trim(),
      description: description.trim(),
      category: ['Academic', 'Application', 'Skill', 'Roadmap', 'Personal'].includes(category) ? category : 'Personal',
      priority: ['Low', 'Medium', 'High', 'Urgent'].includes(priority) ? priority : 'Medium',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      isCompleted: false,
      completedAt: null,
      sourceType: 'user_created',
      sourceRefId: null
    };

    ensureTodos().unshift(newTodo);

    if (isConfigured && supabase) {
      try {
        await supabase.from('student_todos').insert({
          id: newTodo.id,
          student_id: studentId,
          title: newTodo.title,
          description: newTodo.description,
          category: newTodo.category,
          priority: newTodo.priority,
          due_date: newTodo.dueDate,
          is_completed: false,
          source_type: 'user_created'
        });
      } catch (err) {
        console.warn('[Todos POST] Supabase insert warning:', err.message);
      }
    }

    return res.status(201).json({ success: true, todo: newTodo });
  } catch (err) {
    console.error('[Todos POST Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/todos/:id/toggle
 * Toggles completion status and awards +10 XP on completion
 */
router.all(['/:id/toggle'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }
  try {
    const { id } = req.params;
    const todos = ensureTodos();
    const todo = todos.find(t => t.id === id);

    if (todo && todo.studentId !== (req.user?.id || req.user?.email)) {
      return res.status(403).json({ success: false, error: 'You cannot modify another student\'s task.' });
    }

    if (!todo) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    todo.isCompleted = !todo.isCompleted;
    todo.completedAt = todo.isCompleted ? new Date().toISOString() : null;

    let xpGained = 0;
    if (todo.isCompleted) {
      xpGained = 10;
      const user = (DB.users || []).find(u => u.id === todo.studentId);
      if (user) {
        user.xp = (user.xp || 1000) + xpGained;
      }
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from('student_todos').update({
          is_completed: todo.isCompleted,
          completed_at: todo.completedAt
        }).eq('id', id);
      } catch (err) {
        console.warn('[Todos Toggle] Supabase update warning:', err.message);
      }
    }

    return res.json({
      success: true,
      todo,
      xpGained,
      message: todo.isCompleted ? 'Task completed! +10 XP awarded.' : 'Task marked active.'
    });
  } catch (err) {
    console.error('[Todos Toggle Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/todos/:id
 * Deletes a task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todos = ensureTodos();
    const idx = todos.findIndex(t => t.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    if (todos[idx].studentId !== (req.user?.id || req.user?.email)) {
      return res.status(403).json({ success: false, error: 'You cannot delete another student\'s task.' });
    }

    todos.splice(idx, 1);

    if (isConfigured && supabase) {
      try {
        await supabase.from('student_todos').delete().eq('id', id);
      } catch (err) {
        console.warn('[Todos DELETE] Supabase warning:', err.message);
      }
    }

    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('[Todos DELETE Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/todos/system-inject
 * Internal endpoint for other system events to inject tasks
 */
router.post('/system-inject', async (req, res) => {
  try {
    const {
      studentId: _ignoredStudentId,
      title,
      description = '',
      category = 'Application',
      priority = 'High',
      dueDate = null,
      sourceType = 'system_interview',
      sourceRefId = null
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required for system task.' });
    }

    const newTodo = {
      id: `todo-sys-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: req.user?.id || req.user?.email,
      title,
      description,
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      isCompleted: false,
      completedAt: null,
      sourceType,
      sourceRefId
    };

    ensureTodos().unshift(newTodo);
    return res.status(201).json({ success: true, todo: newTodo });
  } catch (err) {
    console.error('[Todos System-Inject Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
