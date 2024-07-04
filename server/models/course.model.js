import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        minLength: [8,'Title must be atleast 8 characters'],
        maxLength: [50,'Title must be less than 50 characters'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minLength: [8,'Description must be atleast 8 characters'],
        maxLength: [500,'Description must be less than 500 characters'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    thumbnail: {
        public_id: {
            type: String,
            required: [true, 'Public ID is required']
        },
        secure_url: {
            type: String,
            required: [true, 'Secure URL is required']
        }
    },
    lectures: [{
        title: String,
        description: String,
        lecture: {
            public_id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            }
        }
    }],
    numberOfLectures: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

const Course = mongoose.model('Course',courseSchema);

export default Course