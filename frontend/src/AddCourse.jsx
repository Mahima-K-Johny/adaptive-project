import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddCourse() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleAddCourse = async () => {
    setError(""); setSuccess("");
    if (!name || !code) {
      setError("All fields required"); 
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/courses/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();

      if (!res.ok) setError(data.message);
      else {
        setSuccess("Course added successfully!");
        setName(""); setCode("");
        setTimeout(() => navigate("/topics"), 1000);
      }
    } catch (err) {
      setError("Server error. Try again later.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Add Course</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <input placeholder="Course Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Course Code" value={code} onChange={e => setCode(e.target.value)} />
      <button onClick={handleAddCourse}>Add Course</button>
    </div>
  );
}
