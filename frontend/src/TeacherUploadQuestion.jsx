import React, { useState } from "react";
import axios from "axios";

const TeacherUploadQuestion = () => {
  const [text, setText] = useState("");
  const [type, setType] = useState("MCQ");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [level, setLevel] = useState(1);

  // Update option
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Submit question
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        text,
        type,
        options: type === "MCQ" ? options : [],
        answer,
        difficulty: Number(difficulty),
        level: Number(level),
      };
      const res = await axios.post("http://localhost:5000/api/teachers/uploadQuestion", payload);
      alert(res.data.message);

      // reset form
      setText("");
      setType("MCQ");
      setOptions(["", "", "", ""]);
      setAnswer("");
      setDifficulty(0);
      setLevel(1);
    } catch (err) {
      console.error(err);
      alert("Error uploading question");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Upload Question</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Question Text:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            style={{ width: "100%", height: "80px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MCQ">MCQ</option>
            <option value="Descriptive">Descriptive</option>
          </select>
        </div>

        {type === "MCQ" && (
          <div style={{ marginBottom: "10px" }}>
            <label>Options:</label>
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                required
                style={{ display: "block", marginBottom: "5px", width: "100%" }}
              />
            ))}
          </div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <label>Correct Answer:</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Difficulty:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value={-1}>Easy</option>
            <option value={0}>Medium</option>
            <option value={1}>Hard</option>
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Level:</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value={1}>Level 1</option>
            <option value={2}>Level 2</option>
            <option value={3}>Level 3</option>
            <option value={4}>Level 4</option>
          </select>
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>Upload Question</button>
      </form>
    </div>
  );
};

export default TeacherUploadQuestion;
