# import os
# from pymongo import MongoClient
# from bson.objectid import ObjectId

# # --- Database Connection ---
# # Hum ek hi baar connect karenge aur use baar-baar istemaal karenge
# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
# client = MongoClient(MONGO_URI)
# db = client['doctor-connect'] # Database ka naam yahan likhein

# # --- Database se Jude Functions ---

# def get_doctor_availability(doctor_name: str, date: str, time: str = None):
#     """
#     Ek doctor ki di gayi date par saare available time slots nikalta hai.
#     """
#     try:
#         doctor = db.doctors.find_one({"name": {'$regex': doctor_name, '$options': 'i'}})
#         if not doctor:
#             return f"Doctor {doctor_name} not found."

#         # Sahi schema ke hisaab se availability dhoondhna
#         date_entry = next((avail for avail in doctor.get("availability", []) if avail.get("date") == date), None)
        
#         if not date_entry:
#             return f"Dr. {doctor_name} has no schedule for {date}."


#         if time:
#             slot = next((s for s in date_entry.get('slots', []) if s.get('time') == time), None)
#             if not slot:
#                 return f"The time slot {time} is not available on {date}."
#             if slot.get('isBooked'):
#                 return f"Sorry, the time slot {time} on {date} is already booked."
#             return f"Dr. {doctor_name} is available on {date} at {time}."
#         else:
#             available_slots = [slot['time'] for slot in date_entry.get('slots', []) if not slot.get('isBooked')]
#             if not available_slots:
#                 return f"Sorry, all slots for Dr. {doctor_name} on {date} are booked."
#             return f"Available slots for Dr. {doctor_name} on {date} are: {', '.join(available_slots)}"

#     except Exception as e:
#         return f"An error occurred: {e}"


# def book_doctor_appointment(doctor_name: str, date: str, time: str, user_id: str):
#     """
#     Ek patient ke liye appointment book karta hai aur slot ko 'booked' mark karta hai.
#     """
#     try:
#         doctor = db.doctors.find_one({"name": {'$regex': doctor_name, '$options': 'i'}})
#         if not doctor:
#             return f"Doctor {doctor_name} not found."

#         # Sahi date aur time slot dhoondhna
#         date_entry = next((avail for avail in doctor.get("availability", []) if avail.get("date") == date), None)
#         if not date_entry:
#             return f"No schedule found for Dr. {doctor_name} on {date}."

#         slot = next((s for s in date_entry.get('slots', []) if s.get('time') == time), None)
#         if not slot:
#             return f"The time slot {time} is not available on {date}."

#         # Double booking ko rokna
#         if slot.get('isBooked'):
#             return f"Sorry, the time slot {time} on {date} is already booked."

#         # Slot ko update karna
#         db.doctors.update_one(
#             { "_id": doctor["_id"], "availability.date": date, "availability.slots.time": time },
#             { 
#                 "$set": { 
#                     "availability.$[dateElem].slots.$[slotElem].isBooked": True,
#                     "availability.$[dateElem].slots.$[slotElem].bookedBy": ObjectId(user_id)
#                 }
#             },
#             array_filters=[
#                 { "dateElem.date": date },
#                 { "slotElem.time": time }
#             ]
#         )
        
#         return f"Success! Your appointment with Dr. {doctor_name} on {date} at {time} is confirmed."

#     except Exception as e:
#         return f"An error occurred during booking: {e}"
