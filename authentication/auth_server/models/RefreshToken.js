module.exports = function(mongoose) {
    const RefreshTokenSchema = new mongoose.Schema({
        userId: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    })
    
    const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)
    return RefreshToken
}