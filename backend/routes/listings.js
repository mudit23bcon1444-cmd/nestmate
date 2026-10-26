// routes/listings.js — listing endpoints pointing to listingsController

const express = require('express');
const multer = require('multer');
const path = require('path');
const { isLoggedIn, isOwner, requireVerifiedEmail } = require('../middleware/auth');
const listingsController = require('../controllers/listingsController');

const router = express.Router();

// Multer config — store images in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'listing-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (jpg, png, webp) are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/listings — public
router.get('/', listingsController.getAllListings);

// GET /api/listings/map — lightweight map coordinates (must be before /:id)
router.get('/map', listingsController.getMapListings);

// GET /api/listings/owner/mine — owner listings (must be before /:id)
router.get('/owner/mine', isLoggedIn, isOwner, listingsController.getOwnerListings);

// GET /api/listings/:id — single listing
router.get('/:id', listingsController.getListingById);

const validate = require('../middleware/validate');
const { createListingSchema, updateListingSchema } = require('../validators/schemas');

// POST /api/listings — create listing (requires verified email)
router.post('/', isLoggedIn, isOwner, requireVerifiedEmail, upload.single('image'), validate(createListingSchema), listingsController.createListing);

// PUT /api/listings/:id — update listing
router.put('/:id', isLoggedIn, isOwner, validate(updateListingSchema), listingsController.updateListing);

// PATCH /api/listings/:id/availability — toggle availability
router.patch('/:id/availability', isLoggedIn, isOwner, listingsController.toggleAvailability);

// DELETE /api/listings/:id — delete listing
router.delete('/:id', isLoggedIn, isOwner, listingsController.deleteListing);

// POST /api/listings/enquire/:propertyId — student enquiry
router.post('/enquire/:propertyId', isLoggedIn, listingsController.sendEnquiry);

module.exports = router;
