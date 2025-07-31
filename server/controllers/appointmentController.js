const Appointment = require('../models/Appointment');

// Book appointment (user)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, fee, symptoms } = req.body;
    const userId = req.user._id;

    const appointment = new Appointment({
      doctor: doctorId,
      user: userId,
      date,
      time,
      fee,
      symptoms, // <-- Save symptoms
      status: 'active' // <-- Always set status to 'active' on booking
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to book appointment' });
  }
};

// Get all appointments for a doctor (with symptoms)
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('user', 'name email')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch appointments' });
  }
};