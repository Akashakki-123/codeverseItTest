import { model, Schema } from 'mongoose';

const taskSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: '{VALUE} is not a valid priority'
        },
        default: 'medium'
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'in-progress', 'completed', 'archived'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    dueDate: {
        type: Date,
        default: null
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Compound indexes for optimal search and sorting by user
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const taskModel = model('Task', taskSchema);
export default taskModel;

