// server.js — robust static server + Cloudinary upload endpoint
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// serve static files from the repository root's "public" folder
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error('ERROR: public directory not found at', PUBLIC_DIR);
} else {
  console.log('Serving static files from', PUBLIC_DIR);
}
app.use(express.static(PUBLIC_DIR));

// configure Cloudinary (set env vars in Render: CLOUD_NAME, API_KEY, API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// multer stores temp uploads in /tmp (Render allows /tmp)
const upload = multer({ dest: '/tmp' });

// POST /upload — accepts form field "video"
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video'
    });

    // remove temp file
    try { fs.unlinkSync(filePath); } catch(e){}

    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ error: err.message || 'upload_failed' });
  }
});

// Fallback: serve index.html from the root public folder
app.get('*', (req, res) => {
  const indexHtml = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Not found: index.html not present. PUBLIC_DIR=' + PUBLIC_DIR);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
