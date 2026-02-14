import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  taskList: {
    type:[{
      userStory: {
        type: String,
        required: true,
        trim: true
      },
      engineeringTask: {
        type: String,
        required: true,
        trim: true
      },
    }],
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


taskSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
