import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorProfileCard = ({ doctor }) => {
  const navigate = useNavigate();
  if (!doctor) return null;
  return (
    <div
      className="doctor-profile-card"
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: 16,
        margin: '12px 0',
        cursor: 'pointer',
        background: '#fafbfc',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
      onClick={() => navigate(`/doctor/${doctor._id}`)}
    >
      <h3 style={{ margin: 0, color: '#1976d2' }}>{doctor.name}</h3>
      <div style={{ fontSize: 15, color: '#444', margin: '4px 0' }}>
        <b>Specialty:</b> {doctor.profileDetails?.specialty || (doctor.profileDetails?.specialties && doctor.profileDetails.specialties.join(', '))}
      </div>
      <div style={{ fontSize: 15, color: '#444' }}>
        <b>City:</b> {doctor.city || doctor.profileDetails?.city}
      </div>
      <div style={{ fontSize: 14, color: '#666', margin: '4px 0' }}>
        <b>Experience:</b> {doctor.profileDetails?.experience} yrs
      </div>
      <div style={{ fontSize: 14, color: '#666' }}>
        <b>Qualification:</b> {doctor.profileDetails?.qualification}
      </div>
      <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>
        <b>Rating:</b> {doctor.rating} ⭐ ({doctor.numReviews} reviews)
      </div>
    </div>
  );
};

export default DoctorProfileCard;
