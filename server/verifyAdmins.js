const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://medSchedule:QnblRsckXl9uTzqf@mernapp.bpbhluf.mongodb.net/medschedule?retryWrites=true&w=majority')
  .then(async () => {
    const result = await User.updateMany(
      { role: { $in: ['admin', 'staff'] } },
      { $set: { isEmailVerified: true } }
    );
    console.log('Updated accounts:', result.modifiedCount);
    process.exit(0);
  })
  .catch(console.error);
