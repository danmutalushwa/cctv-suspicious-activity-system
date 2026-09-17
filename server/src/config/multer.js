const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('./env');

// ============================================================
// BASE UPLOAD DIRECTORIES
// ============================================================

const uploadBasePath = path.join(__dirname, '../../uploads');

const uploadDirectories = [
  path.join(uploadBasePath, 'evidence/images'),
  path.join(uploadBasePath, 'evidence/videos'),
  path.join(uploadBasePath, 'evidence/audio'),
  path.join(uploadBasePath, 'evidence/documents'),
  path.join(uploadBasePath, 'videos')
];

uploadDirectories.forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
});

// ============================================================
// GENERAL EVIDENCE STORAGE
// Images, videos, audio and documents
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadBasePath, 'evidence/images');
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(uploadBasePath, 'evidence/videos');
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(uploadBasePath, 'evidence/audio');
    } else {
      uploadPath = path.join(uploadBasePath, 'evidence/documents');
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueId}${extension}`;

    cb(null, filename);
  }
});

// ============================================================
// GENERAL FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  console.log('Uploaded file MIME type:', file.mimetype);

  const extension = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',

    // Videos
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/avi',
    'video/quicktime',

    // Audio
    'audio/mpeg',
    'audio/wav',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const allowedExtensions = [
    // Images
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',

    // Videos
    '.mp4',
    '.mpeg',
    '.webm',
    '.avi',
    '.mov',

    // Audio
    '.mp3',
    '.wav',

    // Documents
    '.pdf',
    '.doc',
    '.docx'
  ];

  // Normal MIME type
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  // Windows/curl may send files as application/octet-stream.
  // Accept only if the extension is explicitly allowed.
  if (
    file.mimetype === 'application/octet-stream' &&
    allowedExtensions.includes(extension)
  ) {
    console.log(
      `Accepted application/octet-stream based on extension: ${extension}`
    );

    return cb(null, true);
  }

  cb(new Error('File type not supported'), false);
};

// ============================================================
// GENERAL UPLOAD INSTANCE
// ============================================================

const upload = multer({
  storage,

  limits: {
    fileSize: config.maxFileSize || 10485760, // 10MB
    files: 10
  },

  fileFilter
});

// ============================================================
// VIDEO-SPECIFIC STORAGE
// ============================================================

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadBasePath, 'videos');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueId}${extension}`;

    cb(null, filename);
  }
});

// ============================================================
// VIDEO FILE FILTER
// ============================================================

const videoFileFilter = (req, file, cb) => {
  console.log('Video upload MIME type:', file.mimetype);

  const extension = path.extname(file.originalname).toLowerCase();

  const allowedVideoMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/avi',
    'video/quicktime'
  ];

  const allowedVideoExtensions = [
    '.mp4',
    '.mpeg',
    '.webm',
    '.avi',
    '.mov'
  ];

  // Normal video MIME type
  if (allowedVideoMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  // Windows/curl may send video as application/octet-stream
  if (
    file.mimetype === 'application/octet-stream' &&
    allowedVideoExtensions.includes(extension)
  ) {
    console.log(
      `Accepted video application/octet-stream based on extension: ${extension}`
    );

    return cb(null, true);
  }

  cb(
    new Error(
      'Video file type not supported. Please upload MP4, MPEG, WebM, AVI, or MOV.'
    ),
    false
  );
};

// ============================================================
// VIDEO UPLOAD INSTANCE
// ============================================================

const uploadVideo = multer({
  storage: videoStorage,

  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5
  },

  fileFilter: videoFileFilter
});

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 100MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum is 10 files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }

    return res.status(400).json({
      success: false,
      message,
      error: err.code,
      timestamp: new Date().toISOString()
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  upload,
  uploadVideo,
  handleMulterError
};