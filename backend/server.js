const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(cors());

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
  res.json({ fileUrl });
});

// File conversion endpoint (OBJ to STL or STL to OBJ)
app.post('/convert', upload.single('model'), (req, res) => {
  const inputFilePath = path.join(__dirname, 'uploads', req.file.filename);
  const outputFilePath =
    req.file.filename.endsWith('.obj')
      ? inputFilePath.replace('.obj', '.stl')
      : inputFilePath.replace('.stl', '.obj');

  // Run Assimp CLI command for conversion
  const command = `assimp export ${inputFilePath} ${outputFilePath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during conversion: ${error.message}`);
      return res.status(500).json({ error: 'Conversion failed.' });
    }

    const convertedFileUrl = `http://localhost:5000/uploads/${path.basename(
      outputFilePath
    )}`;
    res.json({ convertedFileUrl });
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));
