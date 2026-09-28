const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 20,
            trim: true
        },
        lastName: {
            type: String,
            minLength: 3,
            maxLength: 20,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            immutable: true
        },
        age: {
            type: Number
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },
        problemSolved: {
           type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
            unique:true
            }],
        },
        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
      await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});

// Standard capitalized model name
const User = mongoose.model("User", userSchema);

module.exports = User;