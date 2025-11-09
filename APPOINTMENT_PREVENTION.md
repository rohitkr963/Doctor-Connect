# Appointment Double Booking Prevention

## Problem Solved
User ek doctor ke saath **sirf ek active appointment** book kar sakta hai. Agar user ne pehle se appointment book ki hai, to wo dobara book nahi kar sakta.

## Implementation Details

### Backend Protection (Multi-Level)

#### Level 1: User Already Has Active Appointment (Lines 743-759)
```javascript
// Check if user already has ANY active appointment with THIS doctor
const alreadyBooked = doctor.availability.some(avail => {
    const availDate = new Date(avail.date);
    if (availDate >= today) {  // Only future appointments
        return avail.slots.some(slot =>
            slot.isBooked &&
            slot.bookedBy?.toString() === req.user._id.toString()
        );
    }
    return false;
});

if (alreadyBooked) {
    throw new Error('Aapke paas already ek active appointment hai is doctor ke sath.');
}
```

**When:** User tries to book 2nd appointment
**Error:** "Aapke paas already ek active appointment hai is doctor ke sath."

#### Level 2: Slot Already Booked by Someone (Lines 774-778)
```javascript
// Check if THIS specific slot is already booked
if (slot.isBooked) {
    throw new Error('Yeh slot pehle se booked hai. Kripya koi aur slot chunein.');
}
```

**When:** Two users try to book same slot
**Error:** "Yeh slot pehle se booked hai. Kripya koi aur slot chunein."

## Flow Example

### Scenario 1: User Tries Double Booking
1. User A books appointment with Dr. Sharma on Nov 10 at 9:00 AM ✅
2. User A tries to book another slot with Dr. Sharma on Nov 12 at 10:00 AM ❌
3. **Backend Response:** "Aapke paas already ek active appointment hai is doctor ke sath."

### Scenario 2: Two Users Same Slot
1. User A books Nov 10 at 9:00 AM ✅
2. User B tries to book Nov 10 at 9:00 AM ❌
3. **Backend Response:** "Yeh slot pehle se booked hai. Kripya koi aur slot chunein."

### Scenario 3: Past Appointment (Allowed)
1. User A had appointment on Nov 5 (past) ✅ (completed)
2. User A can book new appointment on Nov 15 ✅
3. **Reason:** Only FUTURE appointments are checked (line 748)

## Technical Details

### Database Check
```javascript
// Doctor Schema -> availability
{
  date: "2025-11-10",
  slots: [
    {
      time: "09:00 AM",
      isBooked: true,
      bookedBy: ObjectId("user123")  // ✅ Booked by User A
    },
    {
      time: "10:00 AM",
      isBooked: false,
      bookedBy: null  // ❌ Available
    }
  ]
}
```

### Queue Prevention
```javascript
// Lines 785-791: Only add to queue if NOT already present
const alreadyInQueue = doctor.queue.find(
    p => p.patientId.toString() === req.user._id.toString()
);
if (!alreadyInQueue) {
    // Add to queue
}
```

## Error Messages

| Error Type | Message (Hindi) | HTTP Status |
|------------|----------------|-------------|
| User has active appointment | Aapke paas already ek active appointment hai is doctor ke sath. | 400 |
| Slot already booked | Yeh slot pehle se booked hai. Kripya koi aur slot chunein. | 400 |
| No date available | No availability for this date | 400 |
| Slot not found | Slot not available | 400 |

## Benefits

✅ **No Double Booking** - User confusion prevented  
✅ **Fair Queue System** - One user = one slot  
✅ **Database Consistency** - No duplicate entries  
✅ **Better UX** - Clear error messages  
✅ **Resource Management** - Doctor's time optimized  

## Future Enhancement Ideas

1. **Frontend Validation**: Disable booking button if user has active appointment
2. **Show Existing Appointment**: Display current appointment details before booking
3. **Cancel & Rebook**: Allow user to cancel existing and book new
4. **Multiple Doctors**: User can book different doctors simultaneously

## API Endpoint
**POST** `/api/doctors/:id/book-appointment`

**Body:**
```json
{
  "date": "2025-11-10",
  "time": "09:00 AM",
  "fee": 500,
  "symptoms": "Fever, headache"
}
```

**Success (200):**
```json
{
  "message": "Appointment booked and added to queue",
  "date": "2025-11-10",
  "time": "09:00 AM",
  "symptoms": "Fever, headache"
}
```

**Error (400):**
```json
{
  "message": "Aapke paas already ek active appointment hai is doctor ke sath."
}
```
