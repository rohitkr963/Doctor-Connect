// backend/utils/agentTools.js
async function bookAppointment(userId) {
  // Dummy logic, replace with real DB/API logic
  return { details: 'Tomorrow 10am' };
}
async function getRecords(userId) {
  // Dummy logic, replace with real DB/API logic
  return { link: 'https://yourapp.com/report/123' };
}
async function sendNotification(userId, msg) {
  // Dummy logic, replace with real notification logic
  return true;
}
module.exports = { bookAppointment, getRecords, sendNotification };
