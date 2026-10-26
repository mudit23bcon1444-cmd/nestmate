// controllers/adminController.js — administrative management business logic using Mongoose

const Listing = require('../models/Listing');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const asyncHandler = require('../utils/asyncHandler');

function findByIdOrLegacyId(Model, id) {
  if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return Model.findById(id);
  }
  return null;
}

// GET /api/admin/listings
exports.getAllListings = asyncHandler(async (req, res) => {
  const rawListings = await Listing.find().populate('owner_id', 'name email').sort({ created_at: -1 }).lean();

  const listings = rawListings.map(l => ({
    ...l,
    id: l._id,
    owner_name: l.owner_id ? l.owner_id.name : null,
    owner_email: l.owner_id ? l.owner_id.email : null
  }));

  return res.status(200).json({ listings });
});

// PATCH /api/admin/listings/:id
exports.updateListingApproval = asyncHandler(async (req, res) => {
  const { is_approved, verification_notes } = req.body;

  if (![1, 2].includes(Number(is_approved))) {
    return res.status(400).json({ error: 'is_approved must be 1 (approve) or 2 (reject).' });
  }

  const listing = await findByIdOrLegacyId(Listing, req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  listing.is_approved = Number(is_approved);
  if (Number(is_approved) === 1) {
    listing.verified_at = new Date();
    listing.verification_notes = verification_notes ? String(verification_notes).trim() : 'Physical photos & GPS coordinates verified by Admin.';
  } else if (Number(is_approved) === 2 && verification_notes) {
    listing.verification_notes = String(verification_notes).trim();
  }
  await listing.save();

  const gpsInfo = (listing.latitude && listing.longitude) ? ` [GPS: ${listing.latitude}, ${listing.longitude}]` : '';
  const action = Number(is_approved) === 1
    ? `Approved & Verified listing #${req.params.id}${gpsInfo}`
    : `Rejected listing #${req.params.id}${gpsInfo}`;

  await AdminLog.create({
    action,
    done_by: req.user.id
  });

  const status = Number(is_approved) === 1 ? 'approved & verified' : 'rejected';
  return res.status(200).json({ message: `Listing ${status} successfully.`, is_approved: Number(is_approved) });
});

const RefreshToken = require('../models/RefreshToken');

// GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    { $sort: { created_at: 1 } },
    {
      $lookup: {
        from: 'listings',
        localField: '_id',
        foreignField: 'owner_id',
        as: 'user_listings'
      }
    },
    {
      $project: {
        password: 0,
        listing_count: { $size: '$user_listings' },
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        is_active: 1,
        created_at: 1
      }
    },
    {
      $addFields: {
        id: '$_id'
      }
    }
  ]);

  return res.status(200).json({ users });
});

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be a boolean.' });
  }

  const user = await findByIdOrLegacyId(User, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.is_active = is_active;
  await user.save();

  if (!is_active) {
    // Revoke all active refresh sessions immediately upon deactivation
    await RefreshToken.deleteMany({ user_id: user._id });
  }

  await AdminLog.create({
    action: `${is_active ? 'Activated' : 'Suspended'} user ${user.email || user.phone || user._id}`,
    done_by: req.user.id
  });

  return res.status(200).json({
    message: `User ${is_active ? 'activated' : 'suspended'} successfully.`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      is_active: user.is_active
    }
  });
});

// GET /api/admin/logs
exports.getAdminLogs = asyncHandler(async (req, res) => {
  const rawLogs = await AdminLog.find()
    .populate('done_by', 'name')
    .sort({ created_at: -1 })
    .limit(100)
    .lean();

  const logs = rawLogs.map(al => ({
    ...al,
    id: al._id,
    admin_name: al.done_by ? al.done_by.name : null
  }));

  return res.status(200).json({ logs });
});
