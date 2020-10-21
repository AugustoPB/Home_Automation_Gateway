module.exports = function(mongoose) {
    const UserSchema = new mongoose.Schema({
        sub: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        picture: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    })
    
    const User = mongoose.model('User', UserSchema)
    return User 
}