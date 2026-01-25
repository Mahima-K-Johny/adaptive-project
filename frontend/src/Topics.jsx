import React, { useEffect, useState } from "react";

export default function Topics() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/courses/all");
        const data = await res.json();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch courses");
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Topics</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {courses.map((course) => (
          <div key={course._id} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
            <h3>{course.name}</h3>
            <p>{course.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
