import React, { useContext } from 'react';
import DoctorAssistantChatbot from '../components/DoctorAssistantChatbot';
import AuthContext from '../context/AuthContext';

// ...existing imports...

const DoctorDashboard = (props) => {
  // ...existing code...
  const { auth } = useContext(AuthContext);
  // ...existing code...

  return (
    <div>
      {/* ...existing dashboard UI... */}
      <h2 className="text-xl font-bold mb-4">Doctor's AI Assistant</h2>
      <DoctorAssistantChatbot doctorId={auth?._id} />
      {/* ...rest of dashboard UI... */}
    </div>
  );
};

export default DoctorDashboard;
