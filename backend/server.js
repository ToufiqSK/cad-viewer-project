const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload endpoint
app.post('/upload', upload.single('model'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  const metadata = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: req.file.path,
  };

  // Store metadata in a JSON file
  const metadataPath = path.join(__dirname, 'metadata.json');
  try {
    const existingMetadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath)) : [];
    existingMetadata.push(metadata);
    fs.writeFileSync(metadataPath, JSON.stringify(existingMetadata));
  } catch (err) {
    console.error(err);
  }

  res.json({ fileUrl });
});

// Model retrieval endpoint
app.get('/models', (req, res) => {
  const metadataPath = path.join(__dirname, 'metadata.json');
  try {
    const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath)) : [];

    // Map metadata to include full URLs
    const modelsWithFullUrl = metadata.map((model) => ({
      ...model,
      url: `http://localhost:5000/uploads/${model.filename}`,
    }));

    res.json(modelsWithFullUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve models' });
  }
});

// Delete a model by filename
app.delete('/models/:filename', (req, res) => {
  const filename = req.params.filename;
  const metadataPath = path.join(__dirname, 'metadata.json');
  const filePath = path.join(__dirname, 'uploads', filename);

  try {
    // Delete the file from the filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update metadata.json to remove the deleted file's entry
    const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath)) : [];
    const updatedMetadata = metadata.filter((model) => model.filename !== filename);
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata));

    res.json({ message: 'Model deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// Serve a specific model by filename
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
