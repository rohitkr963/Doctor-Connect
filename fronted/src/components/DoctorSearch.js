import React, { useState } from 'react';

const DoctorSearch = () => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDoctors([]);
    try {
      const res = await fetch('/api/ai/doctor-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, specialty, city })
      });
      const data = await res.json();
      if (data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
      } else {
        setMessage(data.message || 'No matching doctors found.');
      }
    } catch (err) {
      setError('Error searching for doctors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Find a Doctor</h2>
      <form onSubmit={handleSearch} className="space-y-4">
        <input
          type="text"
          placeholder="Doctor Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Specialty (e.g. Cardiologist)"
          value={specialty}
          onChange={e => setSpecialty(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {message && <div className="text-gray-700 mt-2">{message}</div>}
      {doctors.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Results:</h3>
          <ul className="space-y-4">
            {doctors.map(doc => (
              <li key={doc._id} className="p-4 border rounded bg-gray-50">
                <div className="font-bold text-teal-700 text-lg">{doc.name}</div>
                <div className="text-sm text-gray-700">Specialty: {doc.profileDetails?.specialty || 'N/A'}</div>
                <div className="text-sm text-gray-700">City: {doc.profileDetails?.city || 'N/A'}</div>
                {doc.profileDetails?.experience && (
                  <div className="text-sm text-gray-700">Experience: {doc.profileDetails.experience} years</div>
                )}
                {doc.rating && (
                  <div className="text-sm text-gray-700">Rating: {doc.rating} ⭐</div>
                )}
                <div className="mt-2">
                  <a href={`/doctor/${doc._id}`} className="text-teal-600 hover:underline font-semibold">View Profile</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
