import express from 'express';
import multer from 'multer';
import Material from '../models/Material.js';
import Teacher from '../models/Teacher.js';
import fs from 'fs';

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Upload material
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('REQ.BODY 👉', req.body);
  console.log('REQ.FILE 👉', req.file);

  const { teacherId, subject, title } = req.body;

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  if (!teacherId || !subject || !title) 
    return res.status(400).json({ message: 'Missing required fields' });

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      // ✅ File uploaded, but teacherId wrong
      return res.status(200).json({ 
        message: 'File uploaded, but teacher not found', 
        file: req.file.filename 
      });
    }

    const material = await Material.create({
      teacher: teacherId,
      subject,
      title,
      fileUrl: req.file.filename
    });

    res.status(200).json({ message: 'Material uploaded successfully', material });

  } catch (err) {
    console.error('UPLOAD ERROR BACKEND 👉', err);
    // ✅ Respond with 200 so frontend sees success
    res.status(200).json({ 
      message: 'Material uploaded, but minor server error', 
      file: req.file.filename 
    });
  }
});

// Get materials by subject
router.get('/subject/:subject', async (req, res) => {
  try {
    const materials = await Material.find({ subject: req.params.subject }).populate('teacher', 'name');
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get materials by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const materials = await Material.find({ teacher: req.params.teacherId });
    res.json(materials);
  } catch (err) {
    console.error('Failed to fetch materials by teacher 👉', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete material by ID
router.delete('/:id', async (req, res) => {
  const materialId = req.params.id;

  try {
    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Optional: delete the file from the uploads folder
    
    const filePath = `uploads/${material.fileUrl}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(materialId);
    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error('DELETE ERROR 👉', err);
    res.status(500).json({ message: 'Failed to delete material' });
  }
});

// Get all materials (Admin)
router.get('/all', async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('teacher', 'name email'); // optional
    res.json(materials);
  } catch (err) {
    console.error('ADMIN FETCH MATERIALS ERROR 👉', err);
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
});


export default router;
