# 👨‍⚕️ Doctor-Side Chatbot Requirements & Design

## 🎯 **Purpose**

Doctor-side chatbot should help doctors **manage their practice efficiently** through conversational AI.

---

## 📋 **Core Features**

### **1. Appointment Management** 📅

#### **View Today's Appointments**
```
Doctor: "Aaj ke appointments dikha"
Bot: 
✅ Today's Schedule (9 Nov 2025)

1. 10:00 AM - Rohit Kumar
   Symptoms: Migraine, headache
   Status: Scheduled
   [View Details] [Start Consultation]

2. 11:00 AM - Priya Sharma
   Symptoms: Chest pain
   Status: Scheduled
   [View Details] [Cancel]

3. 02:00 PM - Amit Singh
   Symptoms: Fever, cough
   Status: Completed ✅

Total: 8 appointments | 3 completed | 5 upcoming
```

#### **View Specific Date**
```
Doctor: "kal ke appointments"
Doctor: "12 Nov ko kitne appointments hain"
Bot: Shows appointments for requested date
```

#### **Quick Stats**
```
Doctor: "Today ki summary"
Bot:
📊 Today's Summary (9 Nov 2025)

✅ Completed: 3 patients
⏳ Upcoming: 5 patients
💰 Revenue: ₹2,500
⏱️ Avg consultation time: 15 mins
🎯 On-time rate: 87%
```

---

### **2. Patient Information** 👥

#### **Patient History**
```
Doctor: "Rohit Kumar ka history dikha"
Bot:
📋 Patient History - Rohit Kumar

Previous Visits:
1. 5 Nov 2025 - Fever (Prescribed: Paracetamol)
2. 20 Oct 2025 - Cough (Prescribed: Cough syrup)

Current Appointment:
📅 9 Nov 2025, 10:00 AM
🩺 Symptoms: Migraine
💊 Current Medications: None reported

[View Full History] [Add Notes]
```

#### **Search Patient**
```
Doctor: "Patient search karo - phone 9876543210"
Doctor: "Priya naam ki patient"
Bot: Shows matching patients with quick actions
```

---

### **3. Schedule Management** ⏰

#### **Check Availability**
```
Doctor: "Mere availability dikha"
Bot:
📅 Your Availability

Today (9 Nov):
✅ 10:00 AM - Booked
✅ 11:00 AM - Booked
❌ 12:00 PM - Available
✅ 02:00 PM - Booked
❌ 03:00 PM - Available

Tomorrow (10 Nov):
All slots available
```

#### **Block Slots**
```
Doctor: "Kal 2 PM to 4 PM block kar do"
Bot:
✅ Blocked successfully!
📅 10 Nov 2025
⏰ 2:00 PM - 4:00 PM
Reason: [Emergency leave / Personal / Meeting]

[Confirm] [Cancel]
```

#### **Add Slots**
```
Doctor: "15 Nov ko 10 AM se 5 PM tak slots add karo"
Bot:
✅ Slots added!
📅 15 Nov 2025
⏰ 10:00 AM to 5:00 PM
🔄 Every 30 minutes
Total slots: 14

[Confirm] [Modify]
```

---

### **4. Appointment Actions** ⚡

#### **Cancel Appointment**
```
Doctor: "10 AM wala appointment cancel karo"
Bot:
⚠️ Cancel Appointment?

Patient: Rohit Kumar
Time: 10:00 AM
Reason: [Select reason]
- Emergency
- Doctor unavailable
- Patient request

[Confirm Cancel] [Back]

✅ Cancelled & patient notified via SMS/Email
```

#### **Reschedule**
```
Doctor: "Rohit ka appointment kal 11 AM pe shift karo"
Bot:
🔄 Reschedule Appointment

From: Today 10:00 AM
To: Tomorrow 11:00 AM

[Confirm] [Choose different time]

✅ Rescheduled & patient notified
```

#### **Mark Complete**
```
Doctor: "Rohit ka consultation complete karo"
Bot:
✅ Mark as Complete

Patient: Rohit Kumar
Consultation time: 10:00-10:25 AM (25 mins)

Quick Actions:
- Add prescription
- Add diagnosis
- Schedule follow-up

[Complete] [Add Details]
```

---

### **5. Queue Management** 🚶‍♂️

#### **View Current Queue**
```
Doctor: "Queue dikha"
Bot:
🚶‍♂️ Current Queue (5 patients)

Now Serving: Rohit Kumar (10:00 AM)
⏱️ In consultation: 15 mins

Waiting:
1. Priya Sharma - 11:00 AM (On time)
2. Amit Singh - 11:30 AM (Waiting 10 mins)
3. Neha Gupta - 12:00 PM (Not arrived)

[Call Next] [Skip] [Notify Patient]
```

#### **Call Next Patient**
```
Doctor: "Next patient"
Bot:
✅ Calling Priya Sharma

Symptoms: Chest pain
Previous visit: First time
Age: 28, Female

[Start Consultation] [Patient Not Present]
```

---

### **6. Emergency Handling** 🚨

#### **Emergency Notifications**
```
Bot (Auto):
🚨 URGENT APPOINTMENT REQUEST

Patient: Rajesh Verma
Symptoms: Severe chest pain, breathing difficulty
Phone: 9876543210
Location: 2.5 km away

[Accept Now] [Refer to Emergency] [Call Patient]
```

#### **Priority Booking**
```
Doctor: "Emergency slot book karo - next available"
Bot:
⚡ Emergency Slot Created

Time: Today 12:15 PM (inserted)
Duration: 30 mins
Other appointments adjusted

[Confirm] [Choose time]
```

---

### **7. Analytics & Insights** 📊

#### **Revenue Tracking**
```
Doctor: "Is mahine ka revenue"
Bot:
💰 Revenue Report (November 2025)

Total Earnings: ₹1,25,000
Consultations: 83 patients
Avg per patient: ₹1,506

Week-wise breakdown:
Week 1: ₹28,000 (18 patients)
Week 2: ₹35,000 (23 patients)
Current week: ₹12,000 (8 patients)

[Download Report] [View Details]
```

#### **Patient Analytics**
```
Doctor: "Patient trends dikha"
Bot:
📈 Patient Analytics (Last 30 days)

Total Patients: 95
New Patients: 34 (36%)
Returning: 61 (64%)

Top Symptoms:
1. Fever - 28 patients
2. Cough - 19 patients
3. Headache - 15 patients

Peak Hours: 10 AM - 12 PM
```

---

### **8. Prescription & Notes** 💊

#### **Quick Prescription**
```
Doctor: "Rohit ko prescription likho"
Bot:
📝 Create Prescription - Rohit Kumar

Voice input: "Paracetamol 500mg, twice daily, 3 days"
[OR]
Search medicines: [Type to search]

Added:
✅ Paracetamol 500mg - 2x daily - 3 days

[Add More] [Add Instructions] [Generate PDF]
```

#### **Save Notes**
```
Doctor: "Notes save karo - patient has chronic migraine, refer neurologist"
Bot:
✅ Notes saved for Rohit Kumar

📝 "Patient has chronic migraine, refer neurologist"

Attached to appointment: 9 Nov 2025, 10:00 AM

[Add more] [Done]
```

---

### **9. Communication** 💬

#### **Message Patient**
```
Doctor: "Priya ko message bhejo - bring previous reports"
Bot:
📧 Message to Priya Sharma

Message: "Please bring your previous reports"

Send via:
✅ SMS
✅ WhatsApp
✅ Email

[Send] [Edit] [Cancel]
```

#### **Appointment Reminders**
```
Doctor: "Kal ke patients ko reminder bhejo"
Bot:
📢 Sending Reminders...

✅ 8 patients notified for tomorrow
📱 SMS + WhatsApp sent
⏰ Reminder: 1 day before appointment

[View sent] [Send custom message]
```

---

### **10. Quick Commands** ⚡

```
Doctor: "Help"
Bot:
🤖 Quick Commands

📅 Appointments:
- "aaj ke appointments"
- "kal ka schedule"
- "appointment cancel karo"

👥 Patients:
- "patient search [name/phone]"
- "queue dikha"
- "next patient"

⏰ Schedule:
- "slots add karo"
- "availability dikha"
- "time block karo"

📊 Analytics:
- "today ki summary"
- "revenue report"
- "patient trends"

💬 Actions:
- "prescription likho"
- "message bhejo"
- "notes save karo"
```

---

## 🎨 **UI/UX Design**

### **Color Scheme (Doctor Mode)**
```
Primary: Professional Blue (#2563EB)
Secondary: Medical Green (#10B981)
Accent: Urgent Red (#EF4444)
Background: Clean White/Light Gray
```

### **Dashboard View**
```
┌─────────────────────────────────────┐
│  👨‍⚕️ Dr. hhhhhh                      │
│  🟢 Online | 📅 9 Nov 2025          │
├─────────────────────────────────────┤
│  📊 Quick Stats                     │
│  ⏰ Next: Rohit (10:00 AM)         │
│  👥 Queue: 5 patients               │
│  💰 Today: ₹2,500                   │
├─────────────────────────────────────┤
│  🤖 Chat with Assistant            │
│  [Type your command...]             │
└─────────────────────────────────────┘
```

### **Appointment Card (Compact)**
```
┌──────────────────────────────┐
│ 🕐 10:00 AM                  │
│ 👤 Rohit Kumar               │
│ 📱 9876543210                │
│ 🩺 Migraine, headache        │
│                              │
│ [Start] [View] [Cancel]     │
└──────────────────────────────┘
```

---

## 🔐 **Security & Privacy**

### **Authentication**
```
Doctor: [Opens chatbot]
Bot: 
🔐 Verify Identity

OTP sent to: +91-98765xxxxx
Enter OTP: [____]

[Verify] [Resend OTP]
```

### **Data Access**
- Only doctor's own patients visible
- Sensitive data masked in logs
- HIPAA/patient privacy compliant
- Session timeout after 30 mins inactivity

---

## 🚀 **Advanced Features**

### **1. Voice Commands** 🎤
```
Doctor: [Voice] "Show today's appointments"
Bot: [Processes] Shows appointments
     [Voice response] "You have 8 appointments today"
```

### **2. Smart Suggestions** 💡
```
Bot: 
💡 Smart Suggestions

Your 11 AM slot is still available for tomorrow.
Would you like to:
- Keep it open
- Block it
- Reduce consultation fee for quick booking

[Accept] [Dismiss]
```

### **3. Integration Actions** 🔗
```
Doctor: "Rohit ka ECG report upload karo"
Bot:
📎 Upload Report

Patient: Rohit Kumar
Type: ECG Report
[Choose File] [Take Photo]

✅ Uploaded & linked to appointment
```

---

## 📱 **Mobile Optimization**

### **Quick Action Buttons**
```
┌─────────┬─────────┬─────────┐
│ Today's │  Queue  │  Next   │
│ Schedule│         │ Patient │
└─────────┴─────────┴─────────┘

┌─────────┬─────────┬─────────┐
│ Add     │ Block   │  Stats  │
│ Slots   │ Time    │         │
└─────────┴─────────┴─────────┘
```

---

## 🎯 **Key Differences from Patient Chatbot**

| Feature | Patient Side | Doctor Side |
|---------|-------------|-------------|
| **Purpose** | Book appointments | Manage practice |
| **Tone** | Helpful, friendly | Professional, efficient |
| **Actions** | Search, book | Manage, analyze |
| **Data** | Own appointments | All patients |
| **Priority** | Finding doctors | Time management |
| **UI** | Colorful, engaging | Clean, professional |
| **Notifications** | Reminders | Emergency alerts |

---

## 🧩 **Sample Conversation Flows**

### **Flow 1: Morning Routine**
```
Doctor: [Opens app at 9 AM]

Bot: 
☀️ Good Morning, Dr. hhhhhh!

📅 Today's Overview (9 Nov 2025)
- 8 appointments scheduled
- First patient: Rohit Kumar (10:00 AM)
- 2 new patients
- Revenue target: ₹3,000

[View Schedule] [Start Day]

Doctor: "Start day"

Bot:
✅ Day Started | Timer: 9:00 AM

⏰ Next: Rohit Kumar (10:00 AM)
   Symptoms: Migraine
   [Notify Patient] [View History]

🔔 Reminders sent to all patients
```

### **Flow 2: During Consultation**
```
Doctor: "Rohit ka consultation start karo"

Bot:
⏱️ Consultation Started - 10:02 AM

Patient: Rohit Kumar (28M)
Chief complaint: Migraine
History: Previous visit 2 weeks ago

[Voice Notes] [Add Prescription] [Lab Tests]

---

Doctor: "Prescription - Paracetamol 500mg twice daily"

Bot:
✅ Added to prescription
💊 Paracetamol 500mg - 2x daily - 5 days

[Add more] [Add instructions] [Generate]

---

Doctor: "Follow-up book karo - 2 weeks"

Bot:
📅 Follow-up Scheduled
Date: 23 Nov 2025, 10:00 AM
Patient notified via SMS

[Finish Consultation]
```

### **Flow 3: Emergency Handling**
```
Bot: 🚨 URGENT REQUEST!

New patient: Rajesh (45M)
Symptoms: Chest pain, sweating
Severity: HIGH
Location: 3 km away
Requested: Immediate consultation

[Accept Emergency] [Refer to Hospital] [Call Patient]

---

Doctor: "Accept emergency"

Bot:
✅ Emergency Accepted

⚡ Slot created: Today 12:15 PM
📱 Patient notified
🚗 ETA: 15 minutes

Other appointments adjusted:
- 12:00 PM → Moved to 12:45 PM

[View Details] [Prepare]
```

---

## 🎓 **Training & Onboarding**

### **First Time Setup**
```
Bot:
👋 Welcome, Dr. hhhhhh!

Let's set up your assistant in 3 steps:

Step 1: Working Hours
What are your consultation hours?
[Mon-Fri: 10AM-5PM] [Custom]

Step 2: Slot Duration
How long is each consultation?
[15 mins] [30 mins] [45 mins]

Step 3: Preferences
Notifications: [SMS] [Email] [WhatsApp]
Language: [English] [Hindi] [Both]

[Complete Setup]
```

---

## 💬 **Natural Language Understanding**

### **Intent Examples**

| User Says | Intent | Action |
|-----------|--------|--------|
| "aaj ke appointments" | view_appointments | Show today |
| "Rohit ka history" | patient_history | Show patient data |
| "next patient bulao" | call_next | Move queue |
| "kal 2 PM block karo" | block_time | Block slot |
| "revenue kitna hai" | view_stats | Show earnings |
| "prescription likho" | create_prescription | Open prescription |

---

## 🔧 **Technical Implementation**

### **Additional APIs Needed**
```javascript
// Doctor-specific endpoints
GET  /api/doctor/appointments?date=today
GET  /api/doctor/queue
GET  /api/doctor/patients/:id/history
POST /api/doctor/appointments/:id/complete
POST /api/doctor/slots/block
POST /api/doctor/prescription
GET  /api/doctor/analytics?period=today
POST /api/doctor/notifications/send
```

### **Database Schema Updates**
```javascript
// DoctorChatSession
{
  doctorId: ObjectId,
  sessionId: String,
  context: {
    activePatient: ObjectId,
    activeAction: String,  // 'consultation', 'prescription', etc.
    tempData: Mixed
  },
  history: [{ role, message, timestamp }]
}

// DoctorPreferences
{
  doctorId: ObjectId,
  chatPreferences: {
    language: String,
    voiceEnabled: Boolean,
    quickCommands: [String],
    notificationSettings: Object
  }
}
```

---

## 🎯 **Success Metrics**

### **Track These KPIs**
```
1. Time saved per day
2. Commands used frequency
3. Appointment management efficiency
4. Patient satisfaction (through doctor responsiveness)
5. Feature adoption rate
6. Error/confusion rate in conversations
```

---

## 🚀 **Phase-wise Implementation**

### **Phase 1: MVP (Week 1-2)**
- ✅ View today's appointments
- ✅ Patient search
- ✅ Mark complete
- ✅ Basic stats

### **Phase 2: Core Features (Week 3-4)**
- ✅ Queue management
- ✅ Slot blocking
- ✅ Cancel/Reschedule
- ✅ Patient history

### **Phase 3: Advanced (Week 5-6)**
- ✅ Prescription creation
- ✅ Analytics & reports
- ✅ Emergency handling
- ✅ Smart suggestions

### **Phase 4: Enhancement (Week 7-8)**
- ✅ Voice commands
- ✅ WhatsApp integration
- ✅ Multi-language
- ✅ AI predictions

---

## 📚 **Summary**

**Doctor-side chatbot = Practice Management Assistant**

**Must Have:**
- 📅 Appointment & schedule management
- 👥 Patient information access
- 🚶 Queue management
- 💊 Quick prescription
- 📊 Analytics & insights
- ⚡ Emergency handling

**Nice to Have:**
- 🎤 Voice commands
- 💡 Smart suggestions
- 🔗 External integrations
- 🤖 AI-powered insights

**Focus:**
- ⚡ Speed & efficiency
- 🎯 Action-oriented
- 📱 Mobile-first
- 🔐 Secure & private
- 💼 Professional UI

---

**Goal: Save doctor's time, increase efficiency, improve patient care!** 🎯
