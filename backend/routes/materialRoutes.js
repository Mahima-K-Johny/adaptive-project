// routes/materialRoutes.js
import express from 'express';
import multer from 'multer';
import Material from '../models/Material.js';
import Teacher from '../models/Teacher.js';
import fs from 'fs';
import { createRequire } from 'module';
import AdmZip from 'adm-zip';
import mammoth from 'mammoth';
import path from 'path';

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const router = express.Router();

// ── Multer setup (permanent uploads) ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// ── Multer setup (temp — for /verify only) ───────────────────────────────────
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, 'temp-' + Date.now() + '-' + file.originalname),
});
const tempUpload = multer({ storage: tempStorage });

// helper — delete uploaded file if something goes wrong
const cleanup = (file) => {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

// ── GET teacher's assigned subjects (used by frontend dropdown) ───────────────
router.get('/teacher/:teacherId/subjects', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId).select('name subjects');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
    res.json({ name: teacher.name, subjects: teacher.subjects });
  } catch (err) {
    console.error('FETCH SUBJECTS ERROR 👉', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── VERIFY FILE CONTENT (extracts text for keyword checking) ─────────────────
router.post('/verify', tempUpload.single('file'), async (req, res) => {
    console.log('VERIFY HIT 👉 file:', req.file?.originalname, 'ext:', path.extname(req.file?.originalname || ''));
  if (!req.file) return res.status(400).json({ text: '' });

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();

  try {
    let text = '';

   if (ext === '.pdf') {
  text = await new Promise((resolve) => {
    const { PdfReader } = require('pdfreader');
    const reader = new PdfReader();
    const lines = [];
    reader.parseFileItems(filePath, (err, item) => {
      if (err || !item) return resolve(lines.join(' '));
      if (item.text) lines.push(item.text);
    });
  });
}
    else if (ext === '.pptx' || ext === '.ppt') {
      const zip    = new AdmZip(filePath);
      const slides = zip.getEntries().filter(e =>
        e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml')
      );
      text = slides
        .map(s => s.getData().toString('utf8').replace(/<[^>]+>/g, ' '))
        .join(' ');
    }
    else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      text         = result.value;
    }
    else {
      text = fs.readFileSync(filePath, 'utf8');
    }

    fs.unlinkSync(filePath); // clean up temp file
    return res.json({ text: text.toLowerCase() });

  } catch (err) {
    console.error('VERIFY ERROR 👉', err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.json({ text: '' }); // fallback — frontend will use filename check
  }
});

// ── UPLOAD MATERIAL ───────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('REQ.BODY 👉', req.body);
  console.log('REQ.FILE 👉', req.file);

  const { teacherId, subject, title } = req.body;

  if (!req.file)                        return res.status(400).json({ message: 'No file uploaded.' });
  if (!teacherId || !subject || !title) {
    cleanup(req.file);
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      cleanup(req.file);
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // ── KEY CHECK: subject must be in teacher's assigned subjects ─────────────
    const assignedLower = teacher.subjects.map(s => s.toLowerCase().trim());
    const uploadedLower = subject.toLowerCase().trim();

    if (!assignedLower.includes(uploadedLower)) {
      cleanup(req.file);
      return res.status(403).json({
        message: `❌ You are not assigned to "${subject}". You can only upload notes for: ${teacher.subjects.join(', ')}.`
      });
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    const material = await Material.create({
      teacher:  teacherId,
      subject:  subject.trim(),
      title:    title.trim(),
      fileUrl:  req.file.filename,
    });

    return res.status(200).json({ message: 'Material uploaded successfully!', material });

  } catch (err) {
    console.error('UPLOAD ERROR BACKEND 👉', err);
    cleanup(req.file);
    return res.status(500).json({ message: 'Upload failed. Please try again.' });
  }
});

// ── GET materials by teacher ──────────────────────────────────────────────────
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const materials = await Material.find({ teacher: req.params.teacherId });
    res.json(materials);
  } catch (err) {
    console.error('FETCH MATERIALS ERROR 👉', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET materials by subject ──────────────────────────────────────────────────
router.get('/subject/:subject', async (req, res) => {
  try {
    const materials = await Material.find({ subject: req.params.subject })
      .populate('teacher', 'name');
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET all materials (Admin) ─────────────────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const materials = await Material.find().populate('teacher', 'name email');
    res.json(materials);
  } catch (err) {
    console.error('ADMIN FETCH MATERIALS ERROR 👉', err);
    res.status(500).json({ message: 'Failed to fetch materials.' });
  }
});

// ── DELETE material ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found.' });

    const filePath = `uploads/${material.fileUrl}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Material.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Material deleted successfully.' });
  } catch (err) {
    console.error('DELETE ERROR 👉', err);
    res.status(500).json({ message: 'Failed to delete material.' });
  }
});

export default router;