import React, { useState } from "react";
import axios from "axios";

const TeacherUploadQuestion = () => {
  const [subject,    setSubject]    = useState("");
  const [text,       setText]       = useState("");
  const [type,       setType]       = useState("MCQ");
  const [options,    setOptions]    = useState(["", "", "", ""]);
  const [answer,     setAnswer]     = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [level,      setLevel]      = useState(1);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setOptions(["", "", "", ""]);
    setAnswer("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate subject
    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    // ✅ Validate MCQ answer matches one of the options
    if (type === "MCQ") {
      const filled = options.filter(o => o.trim());
      if (filled.length < 2) {
        alert("Please fill at least 2 options.");
        return;
      }
      if (!filled.includes(answer.trim())) {
        alert("Correct answer must exactly match one of the options.");
        return;
      }
    }

    try {
      const payload = {
        subject:    subject.trim().toLowerCase(), // ✅ normalize to lowercase
        text,
        type,
        options:    type === "MCQ" ? options.filter(o => o.trim()) : [],
        answer:     answer.trim(),
        difficulty: Number(difficulty),
        level:      Number(level),
      };

      const res = await axios.post(
        "http://localhost:5000/api/questions/create", // ✅ correct endpoint
        payload
      );
      alert(res.data.message || "Question uploaded successfully!");

      // Reset form
      setSubject("");
      setText("");
      setType("MCQ");
      setOptions(["", "", "", ""]);
      setAnswer("");
      setDifficulty(0);
      setLevel(1);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error uploading question");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Upload Question</h2>
      <form onSubmit={handleSubmit}>

        {/* ✅ NEW — Subject field */}
        <div style={{ marginBottom: "10px" }}>
          <label>Subject: *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. python, javascript, dsa"
            required
            style={{ width: "100%", padding: "6px" }}
          />
          <small style={{ color: "#888" }}>Must match exam subjects exactly (lowercase)</small>
        </div>

        {/* Level — moved up, teachers should set this first */}
        <div style={{ marginBottom: "10px" }}>
          <label>Level: *</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: "100%", padding: "6px" }}>
            <option value={1}>Level 1 — Easy (10 questions needed)</option>
            <option value={2}>Level 2 — Intermediate (15 questions needed)</option>
            <option value={3}>Level 3 — Difficult (10 questions needed)</option>
          </select>
        </div>

        {/* Question text */}
        <div style={{ marginBottom: "10px" }}>
          <label>Question Text: *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            style={{ width: "100%", height: "80px", padding: "6px" }}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: "10px" }}>
          <label>Type: *</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
          >
            <option value="MCQ">MCQ (Multiple Choice)</option>
            <option value="Descriptive">Descriptive (Text Answer)</option>
          </select>
        </div>

        {/* MCQ Options */}
        {type === "MCQ" && (
          <div style={{ marginBottom: "10px" }}>
            <label>Options: * (min 2)</label>
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                style={{ display: "block", marginBottom: "5px", width: "100%", padding: "6px" }}
              />
            ))}
          </div>
        )}

        {/* Answer */}
        <div style={{ marginBottom: "10px" }}>
          <label>
            Correct Answer: *
            {type === "MCQ"
              ? <small style={{ color: "#888" }}> — must exactly match one option above</small>
              : <small style={{ color: "#888" }}> — keyword the student's answer must contain</small>
            }
          </label>
          {type === "MCQ" ? (
            // ✅ Dropdown for MCQ so teacher can't typo the answer
            <select
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              style={{ width: "100%", padding: "6px" }}
            >
              <option value="">— Select correct answer —</option>
              {options.filter(o => o.trim()).map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. recursion"
              required
              style={{ width: "100%", padding: "6px" }}
            />
          )}
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: "10px" }}>
          <label>Difficulty:</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ width: "100%", padding: "6px" }}
          >
            <option value={-1}>Easy</option>
            <option value={0}>Medium</option>
            <option value={1}>Hard</option>
          </select>
        </div>

        <button type="submit" style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Upload Question
        </button>
      </form>
    </div>
  );
};

export default TeacherUploadQuestion;