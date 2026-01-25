import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentMaterials() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/materials/subject/${subject}`
      );
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <button onClick={() => navigate(-1)}>⬅ Back</button>

      <h2>📚 {subject} Materials</h2>

      {materials.length === 0 ? (
        <p>No materials uploaded yet.</p>
      ) : (
        <ul>
          {materials.map((m) => (
            <li key={m._id} style={{ marginBottom: '10px' }}>
              <strong>{m.title}</strong> <br />
              <a
                href={`http://localhost:5000/uploads/${m.fileUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                View File
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
