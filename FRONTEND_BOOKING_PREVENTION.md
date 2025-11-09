# Frontend Booking Prevention - User Experience

## Overview
User ko **visual indication** milta hai agar uska appointment already booked hai, aur button **disabled** ho jata hai to prevent double booking.

## Implementation

### State Management (Already Exists)
```javascript
const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
```

### Check Logic (Lines 119-133)
```javascript
// Fetch user's appointments and check if already booked with THIS doctor
const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/appointments/my`, {
  headers: { Authorization: `Bearer ${auth.token}` }
});
const found = res.data.find(a => a.doctor === doctorId);
setHasActiveAppointment(!!found);
```

### UI Changes Made

#### Top Booking Button (Lines 277-297)
**Before:**
```jsx
<button onClick={handleBookAppointment}>
  Book Appointment (₹500)
</button>
```

**After:**
```jsx
<button 
  onClick={handleBookAppointment} 
  disabled={hasActiveAppointment}
  className={hasActiveAppointment 
    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
    : 'bg-gradient-to-r from-teal-500 to-green-400 text-white'
  }
>
  {hasActiveAppointment ? 'Already Booked ✓' : `Book Appointment (₹${fee})`}
</button>
{hasActiveAppointment && (
  <p className="text-orange-600">
    ⚠️ Aapka appointment already booked hai is doctor ke sath
  </p>
)}
```

#### Schedule Section Button (Lines 389-413)
**Before:**
```jsx
<button
  onClick={handleBookAppointment}
  disabled={!selectedTime}
>
  Book Appointment (₹500)
</button>
```

**After:**
```jsx
<button
  onClick={handleBookAppointment}
  disabled={!selectedTime || hasActiveAppointment}
  className={
    hasActiveAppointment
      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
      : selectedTime 
        ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white' 
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
>
  {hasActiveAppointment 
    ? 'Already Booked ✓' 
    : `Book Appointment (₹${fee})`
  }
</button>
{hasActiveAppointment && (
  <p className="text-orange-600 bg-orange-50 p-3 rounded-lg">
    ⚠️ Aapka appointment already booked hai. Pehle ye complete karein.
  </p>
)}
```

## Visual States

### State 1: No Active Appointment ✅
```
┌──────────────────────────────────────┐
│  Book Appointment (₹500)             │  ← Green gradient, clickable
└──────────────────────────────────────┘
```

### State 2: Active Appointment Exists ❌
```
┌──────────────────────────────────────┐
│  Already Booked ✓                    │  ← Gray, disabled
└──────────────────────────────────────┘
⚠️ Aapka appointment already booked hai
```

### State 3: No Time Selected ⏸️
```
┌──────────────────────────────────────┐
│  Book Appointment (₹500)             │  ← Gray, disabled
└──────────────────────────────────────┘
(Select time first)
```

## User Flow

### Scenario 1: First Time Booking
1. User opens doctor profile → `hasActiveAppointment = false`
2. Button shows: "Book Appointment (₹500)" - **Green, Enabled** ✅
3. User clicks → Booking flow starts
4. After successful booking → `hasActiveAppointment = true`
5. Button changes to: "Already Booked ✓" - **Gray, Disabled** ❌

### Scenario 2: Already Booked
1. User opens doctor profile → Check appointments API
2. Found appointment with this doctor → `hasActiveAppointment = true`
3. Button shows: "Already Booked ✓" - **Gray, Disabled** ❌
4. Warning message: "⚠️ Aapka appointment already booked hai"
5. User **cannot click** button

### Scenario 3: After Appointment Complete
1. Doctor marks appointment as complete
2. Appointment removed from user's active list
3. User refreshes page → `hasActiveAppointment = false`
4. Button enabled again ✅

## Technical Details

### API Call
```javascript
GET /api/appointments/my
Headers: { Authorization: Bearer <token> }

Response: [
  {
    _id: "abc123",
    doctor: "doctorId456",  // ← This is checked
    date: "2025-11-10",
    time: "09:00 AM"
  }
]
```

### Condition Logic
```javascript
const found = res.data.find(a => a.doctor === doctorId);
// found = appointment object if exists
// found = undefined if no appointment

setHasActiveAppointment(!!found);
// !! converts to boolean
// true if appointment exists
// false if no appointment
```

## Button States Priority

| Condition | Button State | Text |
|-----------|-------------|------|
| hasActiveAppointment = true | Disabled (Gray) | "Already Booked ✓" |
| selectedTime = null | Disabled (Gray) | "Book Appointment" |
| selectedTime = valid | Enabled (Green) | "Book Appointment (₹500)" |

**Priority Order:**
1. hasActiveAppointment → Always wins
2. selectedTime → Secondary check

## Benefits

✅ **Visual Feedback** - User immediately sees status  
✅ **Prevents Confusion** - Clear messaging in Hindi  
✅ **No Accidental Clicks** - Button disabled  
✅ **Better UX** - Warning with ⚠️ emoji  
✅ **Responsive** - Auto-updates after booking  

## Backend Sync

Frontend prevention works with backend:
- **Frontend:** Prevents UI click
- **Backend:** Prevents API call (safety net)

Even if user bypasses frontend, backend will reject with:
```
"Aapke paas already ek active appointment hai is doctor ke sath."
```

## Future Enhancements

1. **Show Appointment Details**: Display current appointment date/time
2. **Cancel & Rebook**: Add option to cancel existing and book new
3. **Countdown Timer**: Show time until appointment
4. **Appointment Card**: Dedicated section for active appointment
