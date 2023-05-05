const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  expertise: [String],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
 
});

module.exports = mongoose.model('Mentor', mentorSchema);