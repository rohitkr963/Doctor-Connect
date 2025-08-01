import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DoctorScheduleManager = () => {
  const [availability, setAvailability] = useState([]);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/doctors/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAvailability(res.data.availability || []);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleSlotChange = (idx, value) => {
    const newSlots = [...slots];
    newSlots[idx] = value;
    setSlots(newSlots);
  };

  const addSlot = () => setSlots([...slots, '']);
  const removeSlot = (idx) => setSlots(slots.filter((_, i) => i !== idx));

  const addDateSlots = () => {
    if (!date || slots.some(s => !s)) return;
    setAvailability([...availability, { date, slots: slots.map(time => ({ time })) }]);
    setDate('');
    setSlots(['']);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.put('/api/doctors/availability', { availability }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Schedule updated!');
    } catch (err) {
      setMessage('Error updating schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Manage Your Schedule</h2>
      {availability.map((a, idx) => (
        <div key={idx}>
          <strong>{a.date}</strong>: {a.slots.map(s => s.time).join(', ')}
        </div>
      ))}
      <div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        {slots.map((slot, idx) => (
          <div key={idx}>
            <input
              type="time"
              value={slot}
              onChange={e => handleSlotChange(idx, e.target.value)}
            />
            {slots.length > 1 && <button onClick={() => removeSlot(idx)}>-</button>}
          </div>
        ))}
        <button onClick={addSlot}>Add Slot</button>
        <button onClick={addDateSlots}>Add Date & Slots</button>
      </div>
      <button onClick={handleSubmit} disabled={loading}>Save Schedule</button>
      {message && <div>{message}</div>}
    </div>
  );
};

export default DoctorScheduleManager;
