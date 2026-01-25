// routes/examRoutes.js
import express from "express";
import ExamSession from "../models/ExamSession.js";
import Question from "../models/Question.js";

const router = express.Router();

/**
 * START EXAM
 * Creates a new exam session and sends the first batch of questions (Level 1)
 */
router.post("/startExam", async (req, res) => {
  try {
    const { studentId } = req.body;

    // Create new exam session
    const examSession = await ExamSession.create({
      studentId,
      ability: 0,
      currentLevel: 1,
      questionsAttempted: []
    });

    // Fetch Level 1 batch (8 MCQ + 2 Descriptive)
    const mcqs = await Question.aggregate([
      { $match: { level: 1, type: "MCQ" } },
      { $sample: { size: 8 } }
    ]);

    const desc = await Question.aggregate([
      { $match: { level: 1, type: "Descriptive" } },
      { $sample: { size: 2 } }
    ]);

    const questionsBatch = [...mcqs, ...desc];

    res.json({
      examSessionId: examSession._id,
      level: 1,
      questions: questionsBatch
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * SUBMIT ANSWER BATCH
 * Accepts all answers for current level batch
 * Updates ability (θ)
 * Determines level progression or exam completion
 */
router.post("/submitAnswer", async (req, res) => {
  try {
    const { examSessionId, answers } = req.body; 
    // answers = [{ questionId, answer }, ...] (all answers for current batch)

    const session = await ExamSession.findById(examSessionId);
    if(!session) return res.status(404).json({ message: "Exam session not found" });

    let correctCount = 0;

    // Process each answer
    for(let ans of answers) {
      const question = await Question.findById(ans.questionId);
      const correct = question.type === "MCQ"
        ? question.answer === ans.answer
        : ans.answer.toLowerCase().includes(question.answer.toLowerCase());

      if(correct) correctCount++;

      // Update ability θ
      const delta = 0.2;
      session.ability += correct ? delta : -delta;

      // Record question attempt
      session.questionsAttempted.push({
        questionId: ans.questionId,
        answer: ans.answer,
        correct,
        thetaAfter: session.ability
      });
    }

    await session.save();

    // Calculate level score %
    const totalQuestions = answers.length;
    const scorePercent = (correctCount / totalQuestions) * 100;
    const passingThreshold = 50; // adjust if needed

    if(scorePercent >= passingThreshold) {
      // Student passed → move to next level
      session.currentLevel += 1;

      // Check if final level exceeded (Level 4 = full descriptive)
      if(session.currentLevel > 4) {
        session.completed = true;
        session.endTime = new Date();
        await session.save();
        return res.json({ message: "Exam completed", finalAbility: session.ability });
      }

      // Determine question counts for next level
      let mcqCount = 0, descCount = 0;
      if(session.currentLevel === 2){ mcqCount = 6; descCount = 4; }
      else if(session.currentLevel === 3){ mcqCount = 4; descCount = 6; }
      else if(session.currentLevel === 4){ mcqCount = 0; descCount = 10; } // full descriptive

      // Fetch randomized batch
      const mcqs = await Question.aggregate([
        { $match: { level: session.currentLevel, type: "MCQ" } },
        { $sample: { size: mcqCount } }
      ]);

      const desc = await Question.aggregate([
        { $match: { level: session.currentLevel, type: "Descriptive" } },
        { $sample: { size: descCount } }
      ]);

      const nextBatch = [...mcqs, ...desc];

      return res.json({
        examSessionId: session._id,
        level: session.currentLevel,
        questions: nextBatch
      });

    } else {
      // Student failed level → end exam
      session.completed = true;
      session.endTime = new Date();
      await session.save();
      return res.json({ message: "Exam ended - level failed", finalAbility: session.ability });
    }

  } catch(err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * END EXAM MANUALLY
 */
router.post("/endExam", async (req,res) => {
  try {
    const { examSessionId } = req.body;
    const session = await ExamSession.findById(examSessionId);
    if(!session) return res.status(404).json({ message: "Not found" });

    session.completed = true;
    session.endTime = new Date();
    await session.save();

    res.json({ message: "Exam ended", finalAbility: session.ability });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
