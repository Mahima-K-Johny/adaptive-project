// routes/verifyRoute.js
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/verify-subject', async (req, res) => {
  const { textContent, subject, fileName } = req.body;

  if (!subject || !fileName) {
    return res.status(400).json({ error: 'Missing subject or fileName' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `A teacher selected subject: "${subject}" and uploaded a file named "${fileName}".

Here is a preview of the file content:
---
${textContent?.slice(0, 3000) || '[File content could not be extracted]'}
---

Analyze whether this content genuinely belongs to the subject "${subject}".
Respond ONLY with valid JSON, no extra text:
{
  "match": true or false,
  "confidence": "high" or "medium" or "low",
  "detectedSubject": "what subject this content actually appears to be about",
  "reason": "one sentence explaining your decision"
}`
      }]
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);
    res.json(result);

  } catch (err) {
    console.error('Verify subject error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;