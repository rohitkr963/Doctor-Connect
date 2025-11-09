# Doctor-Connect Chatbot Architecture

## 🏗️ System Overview

Doctor-Connect uses **TWO interconnected chatbot systems** that work in perfect sync:

### 1️⃣ Patient-Side Chatbot (User Facing)
**Purpose:** Help patients find doctors and book appointments

**Features:**
- 🔍 Search doctors by symptoms/specialty
- 📅 View available slots
- ✅ Book appointments
- 📊 View profiles
- 💬 Natural language support (English/Hindi/Hinglish)

**Tech Stack:**
- AI: Gemini API for intent recognition
- Backend: Express.js
- Database: MongoDB
- UI: React chat interface

---

### 2️⃣ Doctor-Side Chatbot (Doctor Facing)
**Purpose:** Help doctors manage appointments and communicate with patients

**Features:**
- 🔔 Real-time appointment notifications
- ✅ Confirm/Reject/Reschedule appointments via chat
- 📊 View today's schedule
- 💬 Smart command parsing
- 🔄 Auto-sync with doctor dashboard

**Tech Stack:**
- Real-time: Socket.io for instant updates
- AI: Gemini for parsing doctor commands
- Backend: Express.js + Socket.io server
- UI: React chat interface (doctor panel)

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT JOURNEY                              │
└─────────────────────────────────────────────────────────────────────┘

1. Patient Opens Chatbot
   ↓
2. Types: "migraine"
   ↓
3. Patient Chatbot → Backend API → Search Doctors
   ↓
4. Returns: List of Neurology doctors
   ↓
5. Patient clicks doctor → Views profile & slots
   ↓
6. Patient: "Dr. hhhhhh ke sath 9 Nov 11:00 AM pe book karo"
   ↓
7. Backend creates Appointment (status: "pending")
   ↓
8. Socket.io emits: "appointmentRequest" → Doctor Chatbot
   
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCTOR JOURNEY                               │
└─────────────────────────────────────────────────────────────────────┘

9. Doctor Chatbot receives notification:
   "📅 New appointment from Rohit Kumar"
   "🕒 9 Nov 2025, 11:00 AM"
   "💬 Symptoms: Migraine"
   ↓
10. Doctor replies: "confirm"
    ↓
11. Doctor Chatbot → Backend API → Update Appointment (status: "confirmed")
    ↓
12. Socket.io emits: "appointmentUpdate" → Patient Chatbot
    ↓
13. Patient receives: "✅ Dr. hhhhhh confirmed your appointment!"
```

---

## 📡 Real-Time Communication (Socket.io Events)

### Events Flow

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `appointmentRequest` | Backend → Doctor | `{appointmentId, patientName, slot, symptoms}` | New appointment booked |
| `appointmentUpdate` | Doctor → Backend | `{appointmentId, status, newSlot?}` | Doctor confirmed/rescheduled |
| `notifyPatient` | Backend → Patient | `{appointmentId, status, message}` | Status update to patient |
| `doctorMessage` | Doctor → Backend | `{message, doctorId}` | Doctor chat message |
| `patientMessage` | Patient → Backend | `{message, userId}` | Patient chat message |
| `reminder` | Backend → Doctor/Patient | `{appointmentId, time}` | 30min before reminder |

---

## 🗄️ Database Schema Updates

### Appointment Model
```javascript
{
  doctor: ObjectId,
  user: ObjectId,
  date: Date,
  time: String,
  status: "pending" | "confirmed" | "rescheduled" | "cancelled" | "completed",
  symptoms: String,
  fee: Number,
  socketNotified: Boolean,  // NEW: Track if doctor was notified
  patientNotified: Boolean,  // NEW: Track if patient was notified
  lastUpdatedBy: "doctor" | "patient" | "system",  // NEW
  rescheduleHistory: [{  // NEW: Track all changes
    from: String,
    to: String,
    by: String,
    timestamp: Date
  }]
}
```

### ConversationHistory Model (Already exists - no changes needed)
```javascript
{
  userId: ObjectId,
  sessionId: String,
  messages: [{role, text, timestamp, intent}],
  context: {
    lastIntent: String,
    selectedDoctorId: ObjectId,  // For pending bookings
    selectedDoctorName: String,
    pendingBooking: Boolean,
    lastDoctors: Object  // Recently searched doctors
  }
}
```

---

## 🔧 Backend APIs Required

### Patient Chatbot APIs (Already exist)
- `POST /api/chatbot/message` - Main chatbot endpoint
- `GET /api/doctors/search` - Search doctors
- `GET /api/doctors/:id/availability` - Get slots
- `POST /api/appointments` - Book appointment

### Doctor Chatbot APIs (NEW - To be created)
- `POST /api/doctor-chatbot/message` - Doctor chatbot endpoint
- `GET /api/doctor-chatbot/appointments/today` - Get today's appointments
- `PATCH /api/doctor-chatbot/appointments/:id/confirm` - Confirm appointment
- `PATCH /api/doctor-chatbot/appointments/:id/reschedule` - Reschedule
- `PATCH /api/doctor-chatbot/appointments/:id/cancel` - Cancel
- `GET /api/doctor-chatbot/pending` - Get pending requests

---

## 🎯 Doctor Chatbot Command Parsing

### Supported Commands

| Doctor Input | Intent | Action |
|--------------|--------|--------|
| "confirm" | confirm_appointment | Status → confirmed |
| "9 baje ka slot confirm hai" | confirm_with_time | Verify time → confirm |
| "reschedule to 2 PM" | reschedule | Update slot to 2 PM |
| "reject" / "cancel" | reject_appointment | Status → cancelled |
| "today's schedule" | view_schedule | Show all today appointments |
| "pending requests" | view_pending | Show all pending |

### AI Parsing Logic
```javascript
// Gemini prompt for doctor commands
const doctorIntentPrompt = `
Doctor message: "${message}"

Parse the intent as ONE of:
- confirm_appointment: Doctor wants to confirm
- reschedule: Doctor wants to change time (extract new time)
- cancel: Doctor wants to reject
- view_schedule: Doctor wants to see schedule
- view_pending: Doctor wants pending requests

If reschedule, also extract new time.
Format: INTENT | NEW_TIME (if applicable)
`;
```

---

## 🔄 Sync Strategy

### Dashboard ↔ Chatbot Sync

1. **Doctor confirms via Chatbot**
   ```javascript
   // Chatbot updates DB
   await Appointment.update({status: 'confirmed'});
   // Emit event to dashboard
   io.to(doctorId).emit('refreshAppointments');
   // Dashboard auto-refreshes
   ```

2. **Doctor confirms via Dashboard**
   ```javascript
   // Dashboard calls API
   await axios.patch('/api/appointments/:id', {status: 'confirmed'});
   // Backend emits to chatbot
   io.to(doctorId).emit('appointmentUpdate', {...});
   // Chatbot shows: "You confirmed appointment via dashboard"
   ```

3. **Patient books via Chatbot**
   ```javascript
   // Patient chatbot creates appointment
   const apt = await Appointment.create({...});
   // Notify doctor via Socket.io
   io.to(doctorId).emit('appointmentRequest', apt);
   // Also update dashboard
   io.to(doctorId).emit('refreshAppointments');
   ```

---

## ⏰ Reminder System

### Implementation Strategy

```javascript
// Cron job runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const in30Min = new Date(now.getTime() + 30 * 60000);
  
  // Find appointments starting in 30 minutes
  const upcoming = await Appointment.find({
    date: in30Min.toISOString().split('T')[0],
    time: { $gte: formatTime(in30Min), $lte: formatTime(in30Min) },
    status: 'confirmed',
    reminderSent: false
  });
  
  for (const apt of upcoming) {
    // Send to doctor
    io.to(apt.doctor).emit('reminder', {
      message: `Appointment with ${apt.patientName} in 30 minutes`,
      appointmentId: apt._id
    });
    
    // Send to patient
    io.to(apt.user).emit('reminder', {
      message: `Your appointment with Dr. ${apt.doctorName} in 30 minutes`,
      appointmentId: apt._id
    });
    
    apt.reminderSent = true;
    await apt.save();
  }
});
```

---

## 🚀 Implementation Checklist

### Phase 1: Socket.io Infrastructure
- [ ] Install socket.io package
- [ ] Create WebSocket server
- [ ] Define event handlers
- [ ] Test connection with client

### Phase 2: Doctor Chatbot Backend
- [ ] Create `doctorChatbotController.js`
- [ ] Implement intent parsing
- [ ] Add appointment management APIs
- [ ] Integrate with Socket.io

### Phase 3: Real-time Events
- [ ] Emit `appointmentRequest` when patient books
- [ ] Handle `doctorMessage` events
- [ ] Emit `notifyPatient` on status change
- [ ] Test bidirectional flow

### Phase 4: Frontend Integration
- [ ] Create doctor chatbot UI component
- [ ] Connect to Socket.io
- [ ] Handle incoming notifications
- [ ] Send doctor commands

### Phase 5: Reminder System
- [ ] Create cron job
- [ ] Add reminder logic
- [ ] Test 30-minute notifications

### Phase 6: Dashboard Sync
- [ ] Emit events on dashboard actions
- [ ] Update chatbot on external changes
- [ ] Handle conflicts

---

## 📊 Success Metrics

- ✅ Appointment request reaches doctor in < 2 seconds
- ✅ Doctor confirmation updates patient chatbot in < 2 seconds
- ✅ 99% message delivery rate
- ✅ Dashboard and chatbot always in sync
- ✅ Reminders sent exactly 30 minutes before

---

## 🔐 Security Considerations

1. **Authentication**: Verify doctor/patient identity via JWT
2. **Authorization**: Doctor can only access their appointments
3. **Rate Limiting**: Prevent spam messages
4. **Input Validation**: Sanitize all user inputs
5. **Socket.io Auth**: Require token for WebSocket connection

---

## 🎨 UI/UX Flow

### Patient Chatbot UI
```
┌─────────────────────────────┐
│  💬 Chat with us             │
├─────────────────────────────┤
│  You: migraine               │
│  Bot: Found 3 doctors ✅     │
│  [Doctor Cards]              │
│  You: hhhhhh ke sath book    │
│  Bot: Available slots 📅     │
│  [Slot Buttons]              │
│  You: *clicks 11:00 AM*      │
│  Bot: Appointment booked!    │
│       Waiting for doctor... ⏳│
│  Bot: ✅ Dr. confirmed!      │
└─────────────────────────────┘
```

### Doctor Chatbot UI
```
┌─────────────────────────────┐
│  🩺 Doctor Assistant         │
├─────────────────────────────┤
│  Bot: 📅 New Request         │
│       Patient: Rohit Kumar   │
│       Time: 11:00 AM         │
│       Symptoms: Migraine     │
│  You: confirm                │
│  Bot: ✅ Confirmed!          │
│       Patient notified.      │
└─────────────────────────────┘
```

---

## 🔮 Future Enhancements

1. **Voice Assistant**: "Ok Doctor, confirm the 9 AM slot"
2. **WhatsApp Integration**: Send reminders via WhatsApp
3. **Google Calendar Sync**: Auto-add to calendar
4. **AI Suggestions**: "Doctor busy, suggest 2 PM?"
5. **Multi-language**: Support more languages
6. **Video Call**: Start consultation directly from chat
7. **Prescription Upload**: Doctor shares prescription in chat
8. **Payment Integration**: Pay directly in chatbot

---

**Last Updated**: November 9, 2025  
**Version**: 1.0  
**Author**: Doctor-Connect Team
