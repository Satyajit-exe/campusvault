import express from 'express';
import { SystemSetting } from '../models/SystemSetting.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { env } from '../config/env.js';

const router = express.Router();

// Helper to get maintenance mode state
export async function getMaintenanceState() {
  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' });
    if (setting && typeof setting.value === 'object') {
      return setting.value;
    }
    // Fallback to env variable
    return {
      enabled: env.maintenanceMode || false,
      message: 'CampusVault is currently undergoing scheduled platform maintenance and cloud upgrades.',
      estimatedTime: 'Estimated completion: within 15–30 minutes',
    };
  } catch (err) {
    return {
      enabled: env.maintenanceMode || false,
      message: 'Platform maintenance in progress.',
      estimatedTime: 'Soon',
    };
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
