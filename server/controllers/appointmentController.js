const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');

// Book appointment (with double-booking prevention)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, userId, date, time, fee } = req.body;
    // Check if slot already booked
    const exists = await Appointment.findOne({ doctor: doctorId, date, time, status: 'Booked' });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Slot already booked!' });
    }
    // Create appointment
    const appointment = await Appointment.create({ doctor: doctorId, user: userId, date, time, fee });
    // Create notification for doctor
    await Notification.create({
      user: doctorId,
      type: 'doctor',
      message: `New appointment booked by user ${userId} for ${date} at ${time}.`,
      appointment: appointment._id,
    });
    // Create notification for user
    await Notification.create({
      user: userId,
      type: 'user',
      message: `Appointment booked with doctor ${doctorId} for ${date} at ${time}.`,
      appointment: appointment._id,
    });
    res.json({ success: true, appointmentId: appointment._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Booking failed.' });
  }
};
