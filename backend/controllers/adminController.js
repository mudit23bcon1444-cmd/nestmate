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
  const { is_approved } = req.body;

  if (![1, 2].includes(Number(is_approved))) {
    return res.status(400).json({ error: 'is_approved must be 1 (approve) or 2 (reject).' });
  }

  const listing = await findByIdOrLegacyId(Listing, req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  listing.is_approved = Number(is_approved);
  await listing.save();

  const action = Number(is_approved) === 1
    ? `Approved listing #${req.params.id}`
    : `Rejected listing #${req.params.id}`;

  await AdminLog.create({
    action,
    done_by: req.user.id
  });

  const status = Number(is_approved) === 1 ? 'approved' : 'rejected';
  return res.status(200).json({ message: `Listing ${status} successfully.`, is_approved: Number(is_approved) });
});

// GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const rawUsers = await User.find().sort({ created_at: 1 }).lean();

  const users = await Promise.all(rawUsers.map(async (u) => {
    const listingCount = await Listing.countDocuments({ owner_id: u._id });
    return {
      ...u,
      id: u._id,
      listing_count: listingCount
    };
  }));

  return res.status(200).json({ users });
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
