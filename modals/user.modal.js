const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatarFemale: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlbH7sNXBGCWkuN6YMbM_iv13oygBao6Fl7w&s"
    },
    avatarMale: {
        type: String,
        default: "https://thumb.ac-illust.com/0d/0dbe9b3a94fb49e7c18bcdafa9fb5a9f_t.jpeg"
    },
    avatar: {
        type: String
    },
    accessToken: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super-admin'],
        default: 'user'
    }

}, {
    timestamps: true
})


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    return next();
});


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign({ _id: this._id, email: this.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' })
    return token;
}

userSchema.methods.generateRefreshToken = function () {
    const token = jwt.sign({ _id: this._id });
    return token;
}


const User = mongoose.model("User", userSchema);
module.exports = User;