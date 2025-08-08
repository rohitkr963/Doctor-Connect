
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorProfileCard = ({ doctor }) => {
  const navigate = useNavigate();
  if (!doctor) return null;
  return (
    <div
      className="group cursor-pointer bg-white/90 border border-blue-100 rounded-2xl shadow-xl p-5 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl"
      onClick={() => navigate(`/doctor/${doctor._id}`)}
    >
      <div className="w-20 h-20 rounded-full border-4 border-teal-200 shadow-md mb-3 overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={doctor.profileDetails?.profilePicture || `https://i.pravatar.cc/150?u=${doctor._id}`}
          alt={doctor.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-bold text-blue-700 group-hover:text-teal-600 mb-1 text-center">{doctor.name}</h3>
      <div className="flex flex-wrap gap-2 justify-center mb-2">
        {doctor.profileDetails?.specialty && (
          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">{doctor.profileDetails.specialty}</span>
        )}
        {doctor.city && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{doctor.city}</span>
        )}
      </div>
      <div className="text-gray-700 text-sm mb-1 text-center">
        <span className="font-semibold">Experience:</span> {doctor.profileDetails?.experience} yrs
      </div>
      {doctor.profileDetails?.qualification && (
        <div className="text-gray-700 text-sm mb-1 text-center">
          <span className="font-semibold">Qualification:</span> {doctor.profileDetails.qualification}
        </div>
      )}
      {doctor.profileDetails?.bio && (
        <div className="text-gray-500 text-xs mb-2 text-center line-clamp-2">{doctor.profileDetails.bio}</div>
      )}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-yellow-400 text-lg">★</span>
        <span className="font-semibold text-gray-800">{doctor.rating || 0}</span>
        <span className="text-gray-500 text-xs">({doctor.numReviews || 0} reviews)</span>
      </div>
    </div>
  );
};

export default DoctorProfileCard;
