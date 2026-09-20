import express from 'express';
import { SystemSetting } from '../models/SystemSetting.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { env } from '../config/env.js';

const router = express.Router();

// Helper to get maintenance mode state
export async function getMaintenanceState() {
  try {
    // 1. Render Environment Variable has top priority
    if (process.env.MAINTENANCE_MODE === 'true') {
      return {
        enabled: true,
        message: 'CampusVault is currently undergoing scheduled platform maintenance and cloud upgrades.',
        estimatedTime: 'Within 15–30 minutes',
      };
    }
    if (process.env.MAINTENANCE_MODE === 'false') {
      return { enabled: false };
    }

    // 2. Otherwise check dynamic setting from Admin Dashboard
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' });
    if (setting && typeof setting.value === 'object' && setting.value.enabled === true) {
      return setting.value;
    }

    return { enabled: false };
  } catch (err) {
    return { enabled: false };
  }
}

// GET /api/system/status - Public status check for frontend & health
router.get('/status', async (req, res) => {
  const maintenance = await getMaintenanceState();
  res.json({
    success: true,
    platform: 'CampusVault',
    maintenance: Boolean(maintenance.enabled),
    message: maintenance.message || 'CampusVault is undergoing scheduled upgrades.',
    estimatedTime: maintenance.estimatedTime || 'Shortly',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/system/off - Quick route to turn off maintenance mode
router.get('/off', async (req, res) => {
  await SystemSetting.findOneAndUpdate(
    { key: 'maintenance_mode' },
    { value: { enabled: false } },
    { upsert: true }
  );
  res.json({ success: true, maintenance: false, message: 'Maintenance mode disabled successfully!' });
});

// POST /api/system/maintenance - Admin toggle maintenance mode
router.post('/maintenance', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { enabled, message, estimatedTime } = req.body;

    const updatedValue = {
      enabled: Boolean(enabled),
      message: message || 'CampusVault is currently undergoing scheduled maintenance.',
      estimatedTime: estimatedTime || 'Within 15–30 minutes',
    };

    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'maintenance_mode' },
      {
        value: updatedValue,
        description: 'Global maintenance mode state',
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    console.log(`[System] Maintenance mode changed to: ${enabled ? 'ENABLED' : 'DISABLED'} by ${req.user.email}`);

    res.json({
      success: true,
      maintenance: updatedValue,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
