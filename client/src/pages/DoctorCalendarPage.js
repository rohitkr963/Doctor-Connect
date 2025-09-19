import React, { useEffect, useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { getMyQueueAPI, getPatientHistoryAPI } from '../api/doctorApi';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const DoctorCalendarPage = () => {
  const { auth } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Get upcoming appointments (queue)
        const queueData = await getMyQueueAPI(auth.token);
        // Get past appointments (history)
        const historyData = await getPatientHistoryAPI(auth.token);
        // Merge and format for calendar
        const allAppointments = [];
        queueData.queue.forEach((item) => {
          allAppointments.push({
            type: 'Upcoming',
            date: item.appointmentDate ? new Date(item.appointmentDate) : null,
            patientName: item.patientName,
            token: item.tokenNumber,
          });
        });
        historyData.forEach((item) => {
          allAppointments.push({
            type: 'Past',
            date: item.servedAt ? new Date(item.servedAt) : null,
            patientName: item.patientName,
            token: item.tokenNumber,
          });
        });
        setAppointments(allAppointments);
      } catch (err) {
        setError('Could not fetch appointments.');
      }
      setLoading(false);
    };
    if (auth?.token) fetchAppointments();
  }, [auth]);

  // Filter appointments for selected date
  const filteredAppointments = appointments.filter(
    (a) => a.date && a.date.toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Appointment Calendar</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="rounded-lg shadow"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4 text-center">
            {selectedDate.toDateString()} Appointments
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredAppointments.length > 0 ? (
            <ul className="space-y-4">
              {filteredAppointments.map((a, idx) => (
                <li key={idx} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{a.patientName}</p>
                    <p className="text-sm text-gray-500">Token: {a.token}</p>
                  </div>
                  <span className={a.type === 'Upcoming' ? 'text-blue-600' : 'text-green-600'}>
                    {a.type}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No appointments for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorCalendarPage;
import React, { useEffect, useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { getMyQueueAPI, getPatientHistoryAPI } from '../api/doctorApi';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const DoctorCalendarPage = () => {
  const { auth } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Get upcoming appointments (queue)
        const queueData = await getMyQueueAPI(auth.token);
        // Get past appointments (history)
        const historyData = await getPatientHistoryAPI(auth.token);
        // Merge and format for calendar
        const allAppointments = [];
        queueData.queue.forEach((item) => {
          allAppointments.push({
            type: 'Upcoming',
            date: item.appointmentDate ? new Date(item.appointmentDate) : null,
            patientName: item.patientName,
            token: item.tokenNumber,
          });
        });
        historyData.forEach((item) => {
          allAppointments.push({
            type: 'Past',
            date: item.servedAt ? new Date(item.servedAt) : null,
            patientName: item.patientName,
            token: item.tokenNumber,
          });
        });
        setAppointments(allAppointments);
      } catch (err) {
        setError('Could not fetch appointments.');
      }
      setLoading(false);
    };
    if (auth?.token) fetchAppointments();
  }, [auth]);

  // Filter appointments for selected date
  const filteredAppointments = appointments.filter(
    (a) => a.date && a.date.toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Appointment Calendar</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="rounded-lg shadow"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-4 text-center">
            {selectedDate.toDateString()} Appointments
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredAppointments.length > 0 ? (
            <ul className="space-y-4">
              {filteredAppointments.map((a, idx) => (
                <li key={idx} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="font-bold">{a.patientName}</p>
                    <p className="text-sm text-gray-500">Token: {a.token}</p>
                  </div>
                  <span className={a.type === 'Upcoming' ? 'text-blue-600' : 'text-green-600'}>
                    {a.type}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No appointments for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorCalendarPage;
